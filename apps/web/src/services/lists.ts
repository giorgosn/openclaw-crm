import { db } from "@/db";
import {
  lists,
  listAttributes,
  listEntries,
  listEntryValues,
  objects,
  records,
} from "@/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { ATTRIBUTE_TYPE_COLUMN_MAP, type AttributeType } from "@openclaw-crm/shared";
import { batchGetRecordDisplayNames } from "./display-names";

// ─── Types ───────────────────────────────────────────────────────────

interface ListAttrInfo {
  id: string;
  slug: string;
  type: AttributeType;
}

export interface FlatListEntry {
  id: string;
  recordId: string;
  recordDisplayName: string;
  recordObjectSlug: string;
  createdAt: Date;
  listValues: Record<string, unknown>;
}

// ─── Slug helper ─────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Workspace verification ──────────────────────────────────────────

/** Verify that a list belongs to a given workspace. Returns true if valid. */
export async function verifyListWorkspace(listId: string, workspaceId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(objects, eq(lists.objectId, objects.id))
    .where(and(eq(lists.id, listId), eq(objects.workspaceId, workspaceId)))
    .limit(1);
  return !!row;
}

// ─── List CRUD ───────────────────────────────────────────────────────

export async function listLists(workspaceId: string) {
  const rows = await db
    .select({
      id: lists.id,
      objectId: lists.objectId,
      name: lists.name,
      slug: lists.slug,
      isPrivate: lists.isPrivate,
      createdBy: lists.createdBy,
      createdAt: lists.createdAt,
      objectSlug: objects.slug,
      objectName: objects.singularName,
    })
    .from(lists)
    .innerJoin(objects, eq(lists.objectId, objects.id))
    .where(eq(objects.workspaceId, workspaceId))
    .orderBy(lists.name);

  // Get entry counts per list
  const listIds = rows.map((r) => r.id);
  if (listIds.length === 0) return [];

  const counts = await db
    .select({
      listId: listEntries.listId,
      count: sql<number>`count(*)`,
    })
    .from(listEntries)
    .where(inArray(listEntries.listId, listIds))
    .groupBy(listEntries.listId);

  const countMap = new Map(counts.map((c) => [c.listId, Number(c.count)]));

  return rows.map((r) => ({
    ...r,
    entryCount: countMap.get(r.id) || 0,
  }));
}

export async function getList(listId: string) {
  const [row] = await db
    .select({
      id: lists.id,
      objectId: lists.objectId,
      name: lists.name,
      slug: lists.slug,
      isPrivate: lists.isPrivate,
      createdBy: lists.createdBy,
      createdAt: lists.createdAt,
      objectSlug: objects.slug,
      objectName: objects.singularName,
      objectPluralName: objects.pluralName,
    })
    .from(lists)
    .innerJoin(objects, eq(lists.objectId, objects.id))
    .where(eq(lists.id, listId))
    .limit(1);

  if (!row) return null;

  // Load list attributes
  const attrs = await db
    .select()
    .from(listAttributes)
    .where(eq(listAttributes.listId, listId))
    .orderBy(listAttributes.sortOrder);

  // Get entry count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listEntries)
    .where(eq(listEntries.listId, listId));

  return {
    ...row,
    attributes: attrs,
    entryCount: Number(countResult.count),
  };
}

export async function createList(
  objectId: string,
  name: string,
  createdBy: string | null,
  isPrivate = false
) {
  const slug = slugify(name);

  const [row] = await db
    .insert(lists)
    .values({ objectId, name, slug, isPrivate, createdBy })
    .returning();

  return row;
}

export async function updateList(
  listId: string,
  updates: { name?: string; isPrivate?: boolean }
) {
  const setValues: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    setValues.name = updates.name;
    setValues.slug = slugify(updates.name);
  }
  if (updates.isPrivate !== undefined) {
    setValues.isPrivate = updates.isPrivate;
  }

  const [row] = await db
    .update(lists)
    .set(setValues)
    .where(eq(lists.id, listId))
    .returning();

  return row;
}

export async function deleteList(listId: string) {
  const [row] = await db
    .delete(lists)
    .where(eq(lists.id, listId))
    .returning();
  return row;
}

// ─── List Attributes ─────────────────────────────────────────────────

export async function getListAttributes(listId: string) {
  return db
    .select()
    .from(listAttributes)
    .where(eq(listAttributes.listId, listId))
    .orderBy(listAttributes.sortOrder);
}

export async function createListAttribute(
  listId: string,
  data: { slug: string; title: string; type: AttributeType; config?: unknown }
) {
  // Auto-increment sortOrder
  const [maxSort] = await db
    .select({ max: sql<number>`coalesce(max(${listAttributes.sortOrder}), -1)` })
    .from(listAttributes)
    .where(eq(listAttributes.listId, listId));

  const [row] = await db
    .insert(listAttributes)
    .values({
      listId,
      slug: data.slug,
      title: data.title,
      type: data.type,
      config: data.config ?? {},
      sortOrder: Number(maxSort.max) + 1,
    })
    .returning();

  return row;
}

export async function updateListAttribute(
  attrId: string,
  updates: { title?: string; config?: unknown; sortOrder?: number }
) {
  const [row] = await db
    .update(listAttributes)
    .set(updates)
    .where(eq(listAttributes.id, attrId))
    .returning();
  return row;
}

export async function deleteListAttribute(attrId: string) {
  const [row] = await db
    .delete(listAttributes)
    .where(eq(listAttributes.id, attrId))
    .returning();
  return row;
}

// ─── List Entries ────────────────────────────────────────────────────

async function loadListAttributes(listId: string) {
  const attrs = await db
    .select()
    .from(listAttributes)
    .where(eq(listAttributes.listId, listId))
    .orderBy(listAttributes.sortOrder);

  const bySlug = new Map<string, ListAttrInfo>();
  const byId = new Map<string, ListAttrInfo>();

  for (const a of attrs) {
    const info: ListAttrInfo = {
      id: a.id,
      slug: a.slug,
      type: a.type as AttributeType,
    };
    bySlug.set(a.slug, info);
    byId.set(a.id, info);
  }

  return { attrs, bySlug, byId };
}

/** Extract typed value from a list_entry_values row */
function extractEntryValue(
  row: typeof listEntryValues.$inferSelect,
  attrType: AttributeType
): unknown {
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
      return null; // list_entry_values doesn't have this column
    default:
      return null;
  }
}

export async function listListEntries(
  listId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;
  const { byId } = await loadListAttributes(listId);

  // Get entries
  const entryRows = await db
    .select()
    .from(listEntries)
    .where(eq(listEntries.listId, listId))
    .orderBy(desc(listEntries.createdAt))
    .limit(limit)
    .offset(offset);

  if (entryRows.length === 0) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listEntries)
      .where(eq(listEntries.listId, listId));
    return { entries: [], total: Number(countResult.count) };
  }

  const entryIds = entryRows.map((e) => e.id);

  // Load entry values
  const valueRows = await db
    .select()
    .from(listEntryValues)
    .where(inArray(listEntryValues.entryId, entryIds));

  // Group values by entry
  const valuesMap = new Map<string, (typeof listEntryValues.$inferSelect)[]>();
  for (const v of valueRows) {
    const arr = valuesMap.get(v.entryId) || [];
    arr.push(v);
    valuesMap.set(v.entryId, arr);
  }

  // Batch-resolve display names for all records in one call
  const recordIds = [...new Set(entryRows.map((e) => e.recordId))];
  const displayMap = await batchGetRecordDisplayNames(recordIds);

  // Hydrate entries
  const entries: FlatListEntry[] = entryRows.map((entry) => {
    const rowValues = valuesMap.get(entry.id) || [];
    const listValues: Record<string, unknown> = {};

    for (const v of rowValues) {
      const attrInfo = byId.get(v.listAttributeId);
      if (!attrInfo) continue;
      listValues[attrInfo.slug] = extractEntryValue(v, attrInfo.type);
    }

    const info = displayMap.get(entry.recordId);

    return {
      id: entry.id,
      recordId: entry.recordId,
      recordDisplayName: info?.displayName || "Unknown",
      recordObjectSlug: info?.objectSlug || "",
      createdAt: entry.createdAt,
      listValues,
    };
  });

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listEntries)
    .where(eq(listEntries.listId, listId));

  return { entries, total: Number(countResult.count) };
}

export async function addListEntry(
  listId: string,
  recordId: string,
  createdBy: string | null,
  listValues?: Record<string, unknown>
) {
  // Check if entry already exists
  const existing = await db
    .select()
    .from(listEntries)
    .where(
      and(
        eq(listEntries.listId, listId),
        eq(listEntries.recordId, recordId)
      )
    )
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [entry] = await db
    .insert(listEntries)
    .values({ listId, recordId, createdBy })
    .returning();

  // Write list entry values if provided
  if (listValues && Object.keys(listValues).length > 0) {
    await writeEntryValues(entry.id, listId, listValues, createdBy);
  }

  return entry;
}

export async function removeListEntry(entryId: string) {
  const [row] = await db
    .delete(listEntries)
    .where(eq(listEntries.id, entryId))
    .returning();
  return row;
}

export async function updateEntryValues(
  entryId: string,
  listId: string,
  values: Record<string, unknown>,
  updatedBy: string | null
) {
  const { bySlug } = await loadListAttributes(listId);

  // Delete existing values for the attributes being updated
  for (const [slug] of Object.entries(values)) {
    const attrInfo = bySlug.get(slug);
    if (!attrInfo) continue;

    await db
      .delete(listEntryValues)
      .where(
        and(
          eq(listEntryValues.entryId, entryId),
          eq(listEntryValues.listAttributeId, attrInfo.id)
        )
      );
  }

  // Write new values
  await writeEntryValues(entryId, listId, values, updatedBy);
}

async function writeEntryValues(
  entryId: string,
  listId: string,
  values: Record<string, unknown>,
  createdBy: string | null
) {
  const { bySlug } = await loadListAttributes(listId);
  const rows: (typeof listEntryValues.$inferInsert)[] = [];

  for (const [slug, value] of Object.entries(values)) {
    const attrInfo = bySlug.get(slug);
    if (!attrInfo || value === null || value === undefined) continue;

    const column = ATTRIBUTE_TYPE_COLUMN_MAP[attrInfo.type];
    const base: typeof listEntryValues.$inferInsert = {
      entryId,
      listAttributeId: attrInfo.id,
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
        base.timestampValue =
          value instanceof Date ? value : new Date(value as string);
        break;
      case "boolean_value":
        base.booleanValue = value as boolean;
        break;
      case "json_value":
        base.jsonValue = value;
        break;
    }

    rows.push(base);
  }

  if (rows.length > 0) {
    await db.insert(listEntryValues).values(rows);
  }
}

// ─── Records available to add to a list ──────────────────────────────

export async function getAvailableRecords(
  listId: string,
  objectId: string,
  search?: string
) {
  // Get record IDs already in the list + all records for this object in parallel
  const [existingEntries, allRecords] = await Promise.all([
    db
      .select({ recordId: listEntries.recordId })
      .from(listEntries)
      .where(eq(listEntries.listId, listId)),
    db
      .select({ id: records.id })
      .from(records)
      .where(eq(records.objectId, objectId))
      .orderBy(desc(records.createdAt))
      .limit(100),
  ]);

  const existingIds = new Set(existingEntries.map((e) => e.recordId));

  // Filter out already-added records
  const candidateIds = allRecords
    .filter((r) => !existingIds.has(r.id))
    .map((r) => r.id);

  if (candidateIds.length === 0) return [];

  // Batch-resolve all display names in one call
  const displayMap = await batchGetRecordDisplayNames(candidateIds);

  // Apply search filter and limit
  const searchLower = search?.toLowerCase();
  const results = [];
  for (const id of candidateIds) {
    const info = displayMap.get(id);
    const name = info?.displayName || "Unknown";

    if (searchLower && !name.toLowerCase().includes(searchLower)) {
      continue;
    }

    results.push({ id, displayName: name });
    if (results.length >= 20) break;
  }

  return results;
}
