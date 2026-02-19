import { db } from "@/db";
import { records, recordValues, objects, attributes, lists } from "@/db/schema";
import { eq, and, sql, inArray, ilike, or } from "drizzle-orm";
import { extractPersonalName } from "@/lib/display-name";

// ─── Types ───────────────────────────────────────────────────────────

export interface SearchResult {
  type: "record" | "list";
  id: string;
  title: string;
  subtitle: string;
  objectSlug?: string;
  objectName?: string;
  objectIcon?: string;
  url: string;
}

// ─── Search ──────────────────────────────────────────────────────────

/**
 * Full-text search across records and lists in a workspace.
 * Uses PostgreSQL ILIKE for simple substring matching on text_value and json_value fields.
 * For records, searches text_value columns and personal_name json_value.
 */
export async function globalSearch(
  workspaceId: string,
  query: string,
  options: { limit?: number } = {}
): Promise<SearchResult[]> {
  const { limit = 20 } = options;
  if (!query || query.trim().length === 0) return [];

  const term = query.trim();
  const likeTerm = `%${term}%`;

  const results: SearchResult[] = [];

  // 1) Search records by text_value (covers name, email, phone, domain, select, status, etc.)
  //    and by json_value for personal_name (fullName field)
  const matchingRecordIds = await db
    .select({ recordId: recordValues.recordId })
    .from(recordValues)
    .innerJoin(records, eq(records.id, recordValues.recordId))
    .innerJoin(objects, eq(objects.id, records.objectId))
    .where(
      and(
        eq(objects.workspaceId, workspaceId),
        or(
          ilike(recordValues.textValue, likeTerm),
          sql`${recordValues.jsonValue}::text ILIKE ${likeTerm}`
        )
      )
    )
    .groupBy(recordValues.recordId)
    .limit(limit);

  if (matchingRecordIds.length > 0) {
    const ids = matchingRecordIds.map((r) => r.recordId);

    // Load records with their object info
    const recordRows = await db
      .select({
        recordId: records.id,
        objectId: records.objectId,
        objectSlug: objects.slug,
        objectSingularName: objects.singularName,
        objectIcon: objects.icon,
      })
      .from(records)
      .innerJoin(objects, eq(objects.id, records.objectId))
      .where(inArray(records.id, ids));

    // Load display values for these records
    const allValues = await db
      .select({
        recordId: recordValues.recordId,
        attributeId: recordValues.attributeId,
        textValue: recordValues.textValue,
        jsonValue: recordValues.jsonValue,
      })
      .from(recordValues)
      .where(inArray(recordValues.recordId, ids));

    // Load attributes for type info
    const objectIds = [...new Set(recordRows.map((r) => r.objectId))];
    const attrRows = await db
      .select({
        id: attributes.id,
        objectId: attributes.objectId,
        slug: attributes.slug,
        type: attributes.type,
        sortOrder: attributes.sortOrder,
      })
      .from(attributes)
      .where(inArray(attributes.objectId, objectIds))
      .orderBy(attributes.sortOrder);

    // Build attr lookup: attrId -> { slug, type, objectId }
    const attrMap = new Map<string, { slug: string; type: string; objectId: string }>();
    for (const a of attrRows) {
      attrMap.set(a.id, { slug: a.slug, type: a.type, objectId: a.objectId });
    }

    // Group values by recordId
    const valuesMap = new Map<string, typeof allValues>();
    for (const v of allValues) {
      const arr = valuesMap.get(v.recordId) || [];
      arr.push(v);
      valuesMap.set(v.recordId, arr);
    }

    for (const rec of recordRows) {
      const vals = valuesMap.get(rec.recordId) || [];
      let displayName = "Unnamed";
      let subtitle = rec.objectSingularName;

      // Find display name: name attribute or personal_name
      for (const v of vals) {
        const attr = attrMap.get(v.attributeId);
        if (!attr) continue;
        if (attr.type === "personal_name" && v.jsonValue) {
          const name = extractPersonalName(v.jsonValue);
          if (name) {
            displayName = name;
            break;
          }
        }
        if (attr.slug === "name" && v.textValue) {
          displayName = v.textValue;
          break;
        }
      }

      // Find email as subtitle for people
      for (const v of vals) {
        const attr = attrMap.get(v.attributeId);
        if (!attr) continue;
        if (attr.type === "email_address" && v.textValue) {
          subtitle = v.textValue;
          break;
        }
        if (attr.type === "domain" && v.textValue) {
          subtitle = v.textValue;
          break;
        }
      }

      results.push({
        type: "record",
        id: rec.recordId,
        title: displayName,
        subtitle,
        objectSlug: rec.objectSlug,
        objectName: rec.objectSingularName,
        objectIcon: rec.objectIcon,
        url: `/objects/${rec.objectSlug}/${rec.recordId}`,
      });
    }
  }

  // 2) Search lists by name
  const matchingLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      objectName: objects.singularName,
    })
    .from(lists)
    .innerJoin(objects, eq(objects.id, lists.objectId))
    .where(
      and(
        eq(objects.workspaceId, workspaceId),
        ilike(lists.name, likeTerm)
      )
    )
    .limit(5);

  for (const list of matchingLists) {
    results.push({
      type: "list",
      id: list.id,
      title: list.name,
      subtitle: `${list.objectName} list`,
      url: `/lists/${list.id}`,
    });
  }

  return results.slice(0, limit);
}
