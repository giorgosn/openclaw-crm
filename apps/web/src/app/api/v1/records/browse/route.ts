import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success } from "@/lib/api-utils";
import { db } from "@/db";
import { records, objects, recordValues, attributes } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { extractPersonalName } from "@/lib/display-name";

/** GET /api/v1/records/browse — Browse recent records across all objects */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 20),
    50
  );

  // Get all objects in workspace
  const objs = await db
    .select({ id: objects.id, slug: objects.slug, singularName: objects.singularName, icon: objects.icon })
    .from(objects)
    .where(eq(objects.workspaceId, ctx.workspaceId));

  if (objs.length === 0) return success([]);

  const objectIds = objs.map((o) => o.id);
  const objMap = new Map(objs.map((o) => [o.id, o]));

  // Get recent records
  const recentRecords = await db
    .select({ id: records.id, objectId: records.objectId, createdAt: records.createdAt })
    .from(records)
    .where(inArray(records.objectId, objectIds))
    .orderBy(desc(records.createdAt))
    .limit(limit);

  if (recentRecords.length === 0) return success([]);

  const recordIds = recentRecords.map((r) => r.id);

  // Load name attributes for each object
  const nameAttrs = await db
    .select({ id: attributes.id, objectId: attributes.objectId, slug: attributes.slug, type: attributes.type })
    .from(attributes)
    .where(inArray(attributes.objectId, objectIds));

  const nameAttrMap = new Map<string, { id: string; type: string }>();
  for (const a of nameAttrs) {
    if (a.slug === "name" || a.type === "personal_name") {
      nameAttrMap.set(a.objectId, { id: a.id, type: a.type });
    }
  }

  // Also grab domain attributes for subtitle
  const domainAttrMap = new Map<string, string>();
  for (const a of nameAttrs) {
    if (a.type === "domain") {
      domainAttrMap.set(a.objectId, a.id);
    }
  }

  // Load values for these records
  const allAttrIds = [
    ...new Set([
      ...Array.from(nameAttrMap.values()).map((a) => a.id),
      ...Array.from(domainAttrMap.values()),
    ]),
  ];

  const vals = allAttrIds.length > 0
    ? await db
        .select()
        .from(recordValues)
        .where(inArray(recordValues.recordId, recordIds))
    : [];

  // Build value lookup
  const valMap = new Map<string, typeof vals>();
  for (const v of vals) {
    const arr = valMap.get(v.recordId) || [];
    arr.push(v);
    valMap.set(v.recordId, arr);
  }

  const results = recentRecords.map((rec) => {
    const obj = objMap.get(rec.objectId)!;
    const recVals = valMap.get(rec.id) || [];
    const nameAttr = nameAttrMap.get(rec.objectId);
    const domainAttrId = domainAttrMap.get(rec.objectId);

    let displayName = "Unnamed";
    let subtitle = "";

    if (nameAttr) {
      const nameVal = recVals.find((v) => v.attributeId === nameAttr.id);
      if (nameVal) {
        if (nameAttr.type === "personal_name" && nameVal.jsonValue) {
          displayName = extractPersonalName(nameVal.jsonValue) || "Unnamed";
        } else if (nameVal.textValue) {
          displayName = nameVal.textValue;
        }
      }
    }

    if (domainAttrId) {
      const domainVal = recVals.find((v) => v.attributeId === domainAttrId);
      if (domainVal?.textValue) subtitle = domainVal.textValue;
    }

    return {
      recordId: rec.id,
      displayName,
      subtitle,
      objectSlug: obj.slug,
      objectName: obj.singularName,
      objectIcon: obj.icon,
    };
  });

  return success(results);
}
