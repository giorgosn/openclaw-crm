import { sql, eq, and, or, type SQL } from "drizzle-orm";
import { ATTRIBUTE_TYPE_COLUMN_MAP, type AttributeType } from "@openclaw-crm/shared";
import type { FilterCondition, FilterGroup, SortConfig } from "@openclaw-crm/shared";

interface AttributeInfo {
  id: string;
  slug: string;
  type: AttributeType;
}

/**
 * Build a SQL WHERE clause that filters records by joining record_values.
 * Returns a subquery condition: records.id IN (SELECT record_id FROM record_values WHERE ...)
 */
export function buildFilterSQL(
  filter: FilterGroup,
  attrMap: Map<string, AttributeInfo>
): SQL | undefined {
  if (!filter.conditions || filter.conditions.length === 0) return undefined;

  const parts: (SQL | undefined)[] = filter.conditions.map((cond) => {
    if ("operator" in cond && "conditions" in cond) {
      // Nested group
      return buildFilterSQL(cond as FilterGroup, attrMap);
    }
    return buildConditionSQL(cond as FilterCondition, attrMap);
  });

  const validParts = parts.filter((p): p is SQL => p !== undefined);
  if (validParts.length === 0) return undefined;
  if (validParts.length === 1) return validParts[0];

  return filter.operator === "and" ? and(...validParts) : or(...validParts);
}

function buildConditionSQL(
  cond: FilterCondition,
  attrMap: Map<string, AttributeInfo>
): SQL | undefined {
  const attr = attrMap.get(cond.attribute);
  if (!attr) return undefined;

  const colName = ATTRIBUTE_TYPE_COLUMN_MAP[attr.type];
  const attrId = attr.id;

  // For is_empty / is_not_empty, check existence
  if (cond.operator === "is_empty") {
    return sql`NOT EXISTS (
      SELECT 1 FROM record_values rv
      WHERE rv.record_id = records.id
        AND rv.attribute_id = ${attrId}
        AND rv.${sql.raw(colName)} IS NOT NULL
    )`;
  }

  if (cond.operator === "is_not_empty") {
    return sql`EXISTS (
      SELECT 1 FROM record_values rv
      WHERE rv.record_id = records.id
        AND rv.attribute_id = ${attrId}
        AND rv.${sql.raw(colName)} IS NOT NULL
    )`;
  }

  const value = cond.value;

  // Build the comparison expression based on operator + column type
  let comparison: SQL;

  switch (cond.operator) {
    case "equals":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} = ${String(value)}::numeric`;
      } else if (colName === "boolean_value") {
        comparison = sql`rv.${sql.raw(colName)} = ${value}::boolean`;
      } else if (colName === "date_value") {
        comparison = sql`rv.${sql.raw(colName)} = ${value}::date`;
      } else if (colName === "referenced_record_id") {
        comparison = sql`rv.${sql.raw(colName)} = ${value}`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} = ${value}`;
      }
      break;

    case "not_equals":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} != ${String(value)}::numeric`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} != ${value}`;
      }
      break;

    case "contains":
      comparison = sql`rv.${sql.raw(colName)} ILIKE ${"%" + value + "%"}`;
      break;

    case "not_contains":
      comparison = sql`rv.${sql.raw(colName)} NOT ILIKE ${"%" + value + "%"}`;
      break;

    case "starts_with":
      comparison = sql`rv.${sql.raw(colName)} ILIKE ${value + "%"}`;
      break;

    case "ends_with":
      comparison = sql`rv.${sql.raw(colName)} ILIKE ${"%" + value}`;
      break;

    case "greater_than":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} > ${String(value)}::numeric`;
      } else if (colName === "date_value") {
        comparison = sql`rv.${sql.raw(colName)} > ${value}::date`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} > ${value}`;
      }
      break;

    case "less_than":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} < ${String(value)}::numeric`;
      } else if (colName === "date_value") {
        comparison = sql`rv.${sql.raw(colName)} < ${value}::date`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} < ${value}`;
      }
      break;

    case "greater_than_or_equals":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} >= ${String(value)}::numeric`;
      } else if (colName === "date_value") {
        comparison = sql`rv.${sql.raw(colName)} >= ${value}::date`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} >= ${value}`;
      }
      break;

    case "less_than_or_equals":
      if (colName === "number_value") {
        comparison = sql`rv.${sql.raw(colName)} <= ${String(value)}::numeric`;
      } else if (colName === "date_value") {
        comparison = sql`rv.${sql.raw(colName)} <= ${value}::date`;
      } else {
        comparison = sql`rv.${sql.raw(colName)} <= ${value}`;
      }
      break;

    case "in": {
      const arr = Array.isArray(value) ? value : [value];
      if (colName === "number_value") {
        const vals = arr.map((v) => `${Number(v)}`).join(",");
        comparison = sql`rv.${sql.raw(colName)}::text IN (${sql.raw(vals)})`;
      } else {
        // Build a parameterized IN list
        const placeholders = arr.map((v) => sql`${v}`);
        comparison = sql`rv.${sql.raw(colName)} IN (${sql.join(placeholders, sql`, `)})`;
      }
      break;
    }

    case "not_in": {
      const arr = Array.isArray(value) ? value : [value];
      const placeholders = arr.map((v) => sql`${v}`);
      comparison = sql`rv.${sql.raw(colName)} NOT IN (${sql.join(placeholders, sql`, `)})`;
      break;
    }

    default:
      return undefined;
  }

  return sql`EXISTS (
    SELECT 1 FROM record_values rv
    WHERE rv.record_id = records.id
      AND rv.attribute_id = ${attrId}
      AND ${comparison}
  )`;
}

/**
 * Build ORDER BY expressions for sorting by attribute values.
 * Returns an array of SQL expressions suitable for Drizzle's .orderBy(...exprs).
 */
export function buildSortExpressions(
  sorts: SortConfig[],
  attrMap: Map<string, AttributeInfo>
): SQL[] {
  if (!sorts || sorts.length === 0) return [];

  const parts: SQL[] = [];

  for (const sort of sorts) {
    const attr = attrMap.get(sort.attribute);
    if (!attr) continue;

    const colName = ATTRIBUTE_TYPE_COLUMN_MAP[attr.type];
    const dir = sort.direction === "desc" ? sql`DESC` : sql`ASC`;

    parts.push(
      sql`(SELECT rv.${sql.raw(colName)} FROM record_values rv WHERE rv.record_id = records.id AND rv.attribute_id = ${attr.id} LIMIT 1) ${dir}`
    );
  }

  return parts;
}

// Re-export client-safe utilities
export { getOperatorsForType, OPERATOR_LABELS } from "./filter-utils";
