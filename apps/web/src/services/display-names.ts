import { db } from "@/db";
import { records, objects, attributes, recordValues } from "@/db/schema";
import { and, inArray } from "drizzle-orm";
import { extractPersonalName } from "@/lib/display-name";

export interface RecordDisplayInfo {
  displayName: string;
  objectSlug: string;
  objectName: string;
}

/**
 * Batch-resolve display names for an array of record IDs.
 * Uses ~4 queries total regardless of input size, replacing
 * the old per-record helpers that caused N+1 issues.
 */
export async function batchGetRecordDisplayNames(
  recordIds: string[]
): Promise<Map<string, RecordDisplayInfo>> {
  const result = new Map<string, RecordDisplayInfo>();
  if (recordIds.length === 0) return result;

  const uniqueIds = [...new Set(recordIds)];

  // 1. Batch get records → collect objectIds
  const recordRows = await db
    .select({ id: records.id, objectId: records.objectId })
    .from(records)
    .where(inArray(records.id, uniqueIds));

  if (recordRows.length === 0) {
    for (const id of uniqueIds) {
      result.set(id, { displayName: "Unknown", objectSlug: "", objectName: "" });
    }
    return result;
  }

  const objectIds = [...new Set(recordRows.map((r) => r.objectId))];
  const recordObjectMap = new Map(recordRows.map((r) => [r.id, r.objectId]));

  // 2. Batch get objects + attributes in parallel
  const [objectRows, attrRows] = await Promise.all([
    db
      .select({ id: objects.id, slug: objects.slug, singularName: objects.singularName })
      .from(objects)
      .where(inArray(objects.id, objectIds)),
    db
      .select({
        id: attributes.id,
        objectId: attributes.objectId,
        slug: attributes.slug,
        type: attributes.type,
      })
      .from(attributes)
      .where(inArray(attributes.objectId, objectIds)),
  ]);

  const objectMap = new Map(objectRows.map((o) => [o.id, o]));

  // 3. Find the "name" attribute per object (slug="name" or type="personal_name")
  const nameAttrByObject = new Map<string, { id: string; type: string }>();
  for (const a of attrRows) {
    if (a.slug === "name" || a.type === "personal_name") {
      nameAttrByObject.set(a.objectId, { id: a.id, type: a.type });
    }
  }

  // 4. Batch get record_values for those name attributes only
  const nameAttrIds = [...nameAttrByObject.values()].map((a) => a.id);
  const foundRecordIds = recordRows.map((r) => r.id);

  let nameValues: { recordId: string; attributeId: string; textValue: string | null; jsonValue: unknown }[] = [];
  if (nameAttrIds.length > 0 && foundRecordIds.length > 0) {
    nameValues = await db
      .select({
        recordId: recordValues.recordId,
        attributeId: recordValues.attributeId,
        textValue: recordValues.textValue,
        jsonValue: recordValues.jsonValue,
      })
      .from(recordValues)
      .where(
        and(
          inArray(recordValues.recordId, foundRecordIds),
          inArray(recordValues.attributeId, nameAttrIds)
        )
      );
  }

  // Index name values by recordId
  const nameValueByRecord = new Map<
    string,
    { textValue: string | null; jsonValue: unknown; attributeId: string }
  >();
  for (const v of nameValues) {
    nameValueByRecord.set(v.recordId, v);
  }

  // 5. Resolve display names
  for (const id of uniqueIds) {
    const objectId = recordObjectMap.get(id);
    if (!objectId) {
      result.set(id, { displayName: "Unknown", objectSlug: "", objectName: "" });
      continue;
    }

    const obj = objectMap.get(objectId);
    const nameAttr = nameAttrByObject.get(objectId);
    let displayName = "Unnamed";

    if (nameAttr) {
      const val = nameValueByRecord.get(id);
      if (val) {
        if (nameAttr.type === "personal_name" && val.jsonValue) {
          displayName = extractPersonalName(val.jsonValue) || "Unnamed";
        } else if (val.textValue) {
          displayName = val.textValue;
        }
      }
    }

    result.set(id, {
      displayName,
      objectSlug: obj?.slug || "",
      objectName: obj?.singularName || "",
    });
  }

  return result;
}
