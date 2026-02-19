import { db } from "@/db";
import { records, recordValues, attributes, objects } from "@/db/schema";
import { eq, and, inArray, desc, asc, sql, type SQL } from "drizzle-orm";
import { ATTRIBUTE_TYPE_COLUMN_MAP, type AttributeType } from "@openclaw-crm/shared";
import type { FilterGroup, SortConfig } from "@openclaw-crm/shared";
import { extractPersonalName } from "@/lib/display-name";
import { buildFilterSQL, buildSortExpressions } from "@/lib/query-builder";
import { batchGetRecordDisplayNames } from "./display-names";

// ─── Types ───────────────────────────────────────────────────────────

interface AttributeInfo {
  id: string;
  slug: string;
  type: AttributeType;
  isMultiselect: boolean;
}

/** Flat record with values keyed by attribute slug */
export interface FlatRecord {
  id: string;
  objectId: string;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  values: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Load attribute definitions for an object, keyed by slug and by id */
async function loadAttributes(objectId: string) {
  const attrs = await db
    .select()
    .from(attributes)
    .where(eq(attributes.objectId, objectId))
    .orderBy(attributes.sortOrder);

  const bySlug = new Map<string, AttributeInfo>();
  const byId = new Map<string, AttributeInfo & { slug: string }>();

  for (const a of attrs) {
    const info: AttributeInfo = {
      id: a.id,
      slug: a.slug,
      type: a.type as AttributeType,
      isMultiselect: a.isMultiselect,
    };
    bySlug.set(a.slug, info);
    byId.set(a.id, info);
  }

  return { attrs, bySlug, byId };
}

/** Extract the typed value from a record_values row */
function extractValue(row: typeof recordValues.$inferSelect, attrType: AttributeType): unknown {
  const column = ATTRIBUTE_TYPE_COLUMN_MAP[attrType];
  switch (column) {
    case "text_value":
      return row.textValue;
    case "number_value":
      return row.numberValue !== null ? Number(row.numberValue) : null;
    case "date_value":
      return row.dateValue;
    case "timestamp_value":
      return row.timestampValue;
    case "boolean_value":
      return row.booleanValue;
    case "json_value":
      return row.jsonValue;
    case "referenced_record_id":
      return row.referencedRecordId;
    default:
      return null;
  }
}

/** Build the insert fields for a single value row. Returns null if the value is invalid. */
function buildValueRow(
  recordId: string,
  attrInfo: AttributeInfo,
  value: unknown,
  sortOrder: number,
  createdBy: string | null
): typeof recordValues.$inferInsert | null {
  const column = ATTRIBUTE_TYPE_COLUMN_MAP[attrInfo.type];
  const base: typeof recordValues.$inferInsert = {
    recordId,
    attributeId: attrInfo.id,
    sortOrder,
    createdBy,
  };

  switch (column) {
    case "text_value":
      base.textValue = value as string;
      break;
    case "number_value":
      base.numberValue = String(value);
      break;
    case "date_value":
      base.dateValue = value as string;
      break;
    case "timestamp_value":
      base.timestampValue = value instanceof Date ? value : new Date(value as string);
      break;
    case "boolean_value":
      base.booleanValue = value as boolean;
      break;
    case "json_value":
      base.jsonValue = value;
      break;
    case "referenced_record_id": {
      const id = value as string;
      // Validate UUID format to prevent FK violations
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return null; // Skip invalid record references
      }
      base.referencedRecordId = id;
      break;
    }
  }

  return base;
}

/** Hydrate raw record rows + value rows into FlatRecord[] */
async function hydrateRecords(
  recordRows: (typeof records.$inferSelect)[],
  valueRows: (typeof recordValues.$inferSelect)[],
  byId: Map<string, AttributeInfo>
): Promise<FlatRecord[]> {
  // Group values by recordId
  const valuesMap = new Map<string, (typeof recordValues.$inferSelect)[]>();
  for (const v of valueRows) {
    const arr = valuesMap.get(v.recordId) || [];
    arr.push(v);
    valuesMap.set(v.recordId, arr);
  }

  // Collect all referenced record IDs so we can resolve names in one batch
  const refIds = new Set<string>();
  for (const v of valueRows) {
    if (v.referencedRecordId) refIds.add(v.referencedRecordId);
  }

  // Batch-resolve referenced record display names
  const refNameMap = new Map<string, { displayName: string; objectSlug: string }>();
  if (refIds.size > 0) {
    const refRecords = await db
      .select({ id: records.id, objectId: records.objectId })
      .from(records)
      .where(inArray(records.id, [...refIds]));

    if (refRecords.length > 0) {
      const refRecordIds = refRecords.map((r) => r.id);
      const refObjectIds = [...new Set(refRecords.map((r) => r.objectId))];

      // Load name attributes for referenced objects
      const nameAttrs = await db
        .select({ id: attributes.id, objectId: attributes.objectId, slug: attributes.slug, type: attributes.type })
        .from(attributes)
        .where(inArray(attributes.objectId, refObjectIds));

      const nameAttrByObj = new Map<string, { id: string; type: string }>();
      for (const a of nameAttrs) {
        if (a.slug === "name" || a.type === "personal_name") {
          nameAttrByObj.set(a.objectId, { id: a.id, type: a.type });
        }
      }

      // Load objects for slug
      const refObjs = await db
        .select({ id: objects.id, slug: objects.slug })
        .from(objects)
        .where(inArray(objects.id, refObjectIds));
      const objSlugMap = new Map(refObjs.map((o) => [o.id, o.slug]));

      // Load values for referenced records
      const refVals = await db
        .select()
        .from(recordValues)
        .where(inArray(recordValues.recordId, refRecordIds));

      const refValsByRecord = new Map<string, (typeof recordValues.$inferSelect)[]>();
      for (const v of refVals) {
        const arr = refValsByRecord.get(v.recordId) || [];
        arr.push(v);
        refValsByRecord.set(v.recordId, arr);
      }

      for (const rec of refRecords) {
        const nameAttr = nameAttrByObj.get(rec.objectId);
        let displayName = "Unnamed";
        if (nameAttr) {
          const vals = refValsByRecord.get(rec.id) || [];
          const nameVal = vals.find((v) => v.attributeId === nameAttr.id);
          if (nameVal) {
            if (nameAttr.type === "personal_name" && nameVal.jsonValue) {
              displayName = extractPersonalName(nameVal.jsonValue) || "Unnamed";
            } else if (nameVal.textValue) {
              displayName = nameVal.textValue;
            }
          }
        }
        refNameMap.set(rec.id, {
          displayName,
          objectSlug: objSlugMap.get(rec.objectId) || "",
        });
      }
    }
  }

  return recordRows.map((rec) => {
    const rowValues = valuesMap.get(rec.id) || [];
    const values: Record<string, unknown> = {};

    // Group by attribute
    const grouped = new Map<string, (typeof recordValues.$inferSelect)[]>();
    for (const v of rowValues) {
      const arr = grouped.get(v.attributeId) || [];
      arr.push(v);
      grouped.set(v.attributeId, arr);
    }

    for (const [attrId, rows] of grouped) {
      const attrInfo = byId.get(attrId);
      if (!attrInfo) continue;

      if (attrInfo.type === "record_reference") {
        // Resolve to { id, displayName, objectSlug } objects
        if (attrInfo.isMultiselect) {
          values[attrInfo.slug] = rows
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((r) => {
              const refId = r.referencedRecordId;
              const resolved = refId ? refNameMap.get(refId) : null;
              return refId ? { id: refId, displayName: resolved?.displayName || "Unnamed", objectSlug: resolved?.objectSlug || "" } : null;
            })
            .filter(Boolean);
        } else {
          const refId = rows[0].referencedRecordId;
          const resolved = refId ? refNameMap.get(refId) : null;
          values[attrInfo.slug] = refId
            ? { id: refId, displayName: resolved?.displayName || "Unnamed", objectSlug: resolved?.objectSlug || "" }
            : null;
        }
      } else if (attrInfo.isMultiselect) {
        values[attrInfo.slug] = rows
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((r) => extractValue(r, attrInfo.type));
      } else {
        values[attrInfo.slug] = extractValue(rows[0], attrInfo.type);
      }
    }

    return {
      id: rec.id,
      objectId: rec.objectId,
      createdAt: rec.createdAt,
      createdBy: rec.createdBy,
      updatedAt: rec.updatedAt,
      values,
    };
  });
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function listRecords(
  objectId: string,
  options: { limit?: number; offset?: number; filter?: FilterGroup; sorts?: SortConfig[] } = {}
) {
  const { limit = 50, offset = 0, filter, sorts } = options;

  const { byId, bySlug } = await loadAttributes(objectId);

  // Build attribute map for query builder (keyed by slug)
  const attrMap = new Map<string, { id: string; slug: string; type: AttributeType }>();
  for (const [slug, info] of bySlug) {
    attrMap.set(slug, info);
  }

  // Build filter SQL
  const filterSQL = filter ? buildFilterSQL(filter, attrMap) : undefined;

  // Build sort expressions
  const sortExprs = sorts ? buildSortExpressions(sorts, attrMap) : [];

  // Combined WHERE: objectId + optional filter
  const baseWhere = eq(records.objectId, objectId);
  const whereClause = filterSQL ? and(baseWhere, filterSQL) : baseWhere;

  // Build query
  const query = db
    .select()
    .from(records)
    .where(whereClause)
    .orderBy(...(sortExprs.length > 0 ? sortExprs : [asc(records.sortOrder), desc(records.createdAt)]))
    .limit(limit)
    .offset(offset);

  const recordRows = await query;

  if (recordRows.length === 0) {
    // Still need the count (could be 0 or just page boundary)
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(records)
      .where(whereClause);
    return { records: [], total: Number(countResult.count) };
  }

  const recordIds = recordRows.map((r) => r.id);
  const valueRows = await db
    .select()
    .from(recordValues)
    .where(inArray(recordValues.recordId, recordIds));

  // Get total count (with same filter)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(records)
    .where(whereClause);

  return {
    records: await hydrateRecords(recordRows, valueRows, byId),
    total: Number(countResult.count),
  };
}

export async function getRecord(objectId: string, recordId: string) {
  const { byId } = await loadAttributes(objectId);

  const recordRows = await db
    .select()
    .from(records)
    .where(and(eq(records.id, recordId), eq(records.objectId, objectId)))
    .limit(1);

  if (recordRows.length === 0) return null;

  const valueRows = await db
    .select()
    .from(recordValues)
    .where(eq(recordValues.recordId, recordId));

  return (await hydrateRecords(recordRows, valueRows, byId))[0];
}

export async function createRecord(
  objectId: string,
  input: Record<string, unknown>,
  createdBy: string | null
) {
  const { bySlug } = await loadAttributes(objectId);

  // Insert record row
  const [record] = await db
    .insert(records)
    .values({ objectId, createdBy })
    .returning();

  // Insert value rows
  await writeValues(record.id, input, bySlug, createdBy);

  // Return hydrated
  return getRecord(objectId, record.id);
}

export async function updateRecord(
  objectId: string,
  recordId: string,
  input: Record<string, unknown>,
  updatedBy: string | null
) {
  const { bySlug } = await loadAttributes(objectId);

  // Check record exists
  const existing = await db
    .select()
    .from(records)
    .where(and(eq(records.id, recordId), eq(records.objectId, objectId)))
    .limit(1);

  if (existing.length === 0) return null;

  // Update timestamp
  await db
    .update(records)
    .set({ updatedAt: new Date() })
    .where(eq(records.id, recordId));

  // Delete existing values for the attributes being updated, then insert new
  for (const [slug, value] of Object.entries(input)) {
    const attrInfo = bySlug.get(slug);
    if (!attrInfo) continue;

    // Delete old values for this attribute
    await db
      .delete(recordValues)
      .where(
        and(
          eq(recordValues.recordId, recordId),
          eq(recordValues.attributeId, attrInfo.id)
        )
      );
  }

  // Write new values
  await writeValues(recordId, input, bySlug, updatedBy);

  return getRecord(objectId, recordId);
}

export async function deleteRecord(objectId: string, recordId: string) {
  const existing = await db
    .select()
    .from(records)
    .where(and(eq(records.id, recordId), eq(records.objectId, objectId)))
    .limit(1);

  if (existing.length === 0) return null;

  await db.delete(records).where(eq(records.id, recordId));
  return existing[0];
}

/** Write attribute values for a record */
async function writeValues(
  recordId: string,
  input: Record<string, unknown>,
  bySlug: Map<string, AttributeInfo>,
  createdBy: string | null
) {
  const rows: (typeof recordValues.$inferInsert)[] = [];

  for (const [slug, value] of Object.entries(input)) {
    const attrInfo = bySlug.get(slug);
    if (!attrInfo) continue;
    if (value === null || value === undefined) continue;

    if (attrInfo.isMultiselect && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const row = buildValueRow(recordId, attrInfo, value[i], i, createdBy);
        if (row) rows.push(row);
      }
    } else {
      const row = buildValueRow(recordId, attrInfo, value, 0, createdBy);
      if (row) rows.push(row);
    }
  }

  if (rows.length > 0) {
    await db.insert(recordValues).values(rows);
  }
}

/** Get records that reference a given record (reverse lookups) */
export async function getRelatedRecords(recordId: string) {
  // 1. Find all record_values that reference this record
  const refs = await db
    .select({
      recordId: recordValues.recordId,
      attributeId: recordValues.attributeId,
    })
    .from(recordValues)
    .where(eq(recordValues.referencedRecordId, recordId));

  if (refs.length === 0) return [];

  // 2. Get the source records
  const refRecordIds = [...new Set(refs.map((r) => r.recordId))];
  const refRecords = await db
    .select({ id: records.id, objectId: records.objectId, createdAt: records.createdAt })
    .from(records)
    .where(inArray(records.id, refRecordIds));

  if (refRecords.length === 0) return [];

  // 3. Batch-resolve display names
  const displayMap = await batchGetRecordDisplayNames(refRecords.map((r) => r.id));

  return refRecords.map((rec) => {
    const info = displayMap.get(rec.id);
    return {
      recordId: rec.id,
      objectSlug: info?.objectSlug ?? "",
      objectName: info?.objectName ?? "",
      displayName: info?.displayName ?? "Unnamed",
      createdAt: rec.createdAt,
    };
  });
}

/** Get records that this record references (forward lookups) */
export async function getForwardReferences(recordId: string) {
  // 1. Get outgoing references
  const refs = await db
    .select({
      attributeId: recordValues.attributeId,
      referencedRecordId: recordValues.referencedRecordId,
    })
    .from(recordValues)
    .where(
      and(
        eq(recordValues.recordId, recordId),
        sql`${recordValues.referencedRecordId} IS NOT NULL`
      )
    );

  if (refs.length === 0) return [];

  const validRefs = refs.filter((r) => r.referencedRecordId != null);
  if (validRefs.length === 0) return [];

  // 2. Batch-resolve display names + batch get attribute titles in parallel
  const targetRecordIds = [...new Set(validRefs.map((r) => r.referencedRecordId!))];
  const attrIds = [...new Set(validRefs.map((r) => r.attributeId))];

  const [displayMap, attrRows] = await Promise.all([
    batchGetRecordDisplayNames(targetRecordIds),
    db
      .select({ id: attributes.id, title: attributes.title })
      .from(attributes)
      .where(inArray(attributes.id, attrIds)),
  ]);

  const attrTitleMap = new Map(attrRows.map((a) => [a.id, a.title]));

  // 3. Assemble results
  return validRefs
    .map((ref) => {
      const info = displayMap.get(ref.referencedRecordId!);
      if (!info) return null;
      return {
        recordId: ref.referencedRecordId!,
        objectSlug: info.objectSlug,
        objectName: info.objectName,
        attributeTitle: attrTitleMap.get(ref.attributeId) ?? "",
        displayName: info.displayName,
      };
    })
    .filter(Boolean) as {
      recordId: string;
      objectSlug: string;
      objectName: string;
      attributeTitle: string;
      displayName: string;
    }[];
}

/** Assert (upsert) a record by matching on a unique attribute */
export async function assertRecord(
  objectId: string,
  matchAttribute: string,
  matchValue: unknown,
  input: Record<string, unknown>,
  createdBy: string | null
) {
  const { bySlug } = await loadAttributes(objectId);

  const attrInfo = bySlug.get(matchAttribute);
  if (!attrInfo) throw new Error(`Unknown attribute: ${matchAttribute}`);

  const column = ATTRIBUTE_TYPE_COLUMN_MAP[attrInfo.type];

  // Find existing record with this attribute value
  let existingRecordId: string | null = null;

  if (column === "text_value") {
    const rows = await db
      .select({ recordId: recordValues.recordId })
      .from(recordValues)
      .where(
        and(
          eq(recordValues.attributeId, attrInfo.id),
          eq(recordValues.textValue, matchValue as string)
        )
      )
      .limit(1);
    existingRecordId = rows[0]?.recordId ?? null;
  } else if (column === "number_value") {
    const rows = await db
      .select({ recordId: recordValues.recordId })
      .from(recordValues)
      .where(
        and(
          eq(recordValues.attributeId, attrInfo.id),
          eq(recordValues.numberValue, String(matchValue))
        )
      )
      .limit(1);
    existingRecordId = rows[0]?.recordId ?? null;
  }

  if (existingRecordId) {
    // Verify it belongs to the right object
    const rec = await db
      .select()
      .from(records)
      .where(and(eq(records.id, existingRecordId), eq(records.objectId, objectId)))
      .limit(1);

    if (rec.length > 0) {
      return updateRecord(objectId, existingRecordId, input, createdBy);
    }
  }

  // Create new
  return createRecord(objectId, { ...input, [matchAttribute]: matchValue }, createdBy);
}

// ─── Reorder ──────────────────────────────────────────────────────────

export async function reorderRecords(objectId: string, orderedRecordIds: string[]) {
  if (orderedRecordIds.length === 0) return;

  const updates = orderedRecordIds.map((id, index) =>
    db.update(records).set({ sortOrder: index }).where(and(eq(records.id, id), eq(records.objectId, objectId)))
  );

  await Promise.all(updates);
}
