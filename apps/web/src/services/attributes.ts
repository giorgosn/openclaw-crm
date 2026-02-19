import { db } from "@/db";
import { attributes, selectOptions, statuses } from "@/db/schema";
import { eq, and, max } from "drizzle-orm";
import type { AttributeType } from "@openclaw-crm/shared";

export async function listAttributes(objectId: string) {
  const attrs = await db
    .select()
    .from(attributes)
    .where(eq(attributes.objectId, objectId))
    .orderBy(attributes.sortOrder);

  return Promise.all(
    attrs.map(async (attr) => {
      if (attr.type === "select") {
        const options = await db
          .select()
          .from(selectOptions)
          .where(eq(selectOptions.attributeId, attr.id))
          .orderBy(selectOptions.sortOrder);
        return { ...attr, options };
      }
      if (attr.type === "status") {
        const statusList = await db
          .select()
          .from(statuses)
          .where(eq(statuses.attributeId, attr.id))
          .orderBy(statuses.sortOrder);
        return { ...attr, statuses: statusList };
      }
      return attr;
    })
  );
}

export async function getAttributeById(id: string) {
  const rows = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAttributeBySlug(objectId: string, slug: string) {
  const rows = await db
    .select()
    .from(attributes)
    .where(and(eq(attributes.objectId, objectId), eq(attributes.slug, slug)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createAttribute(
  objectId: string,
  input: {
    slug: string;
    title: string;
    type: AttributeType;
    config?: Record<string, unknown>;
    isRequired?: boolean;
    isUnique?: boolean;
    isMultiselect?: boolean;
  }
) {
  // Get next sort order
  const [result] = await db
    .select({ maxOrder: max(attributes.sortOrder) })
    .from(attributes)
    .where(eq(attributes.objectId, objectId));

  const nextOrder = (result?.maxOrder ?? -1) + 1;

  const [attr] = await db
    .insert(attributes)
    .values({
      objectId,
      slug: input.slug,
      title: input.title,
      type: input.type,
      config: input.config || {},
      isSystem: false,
      isRequired: input.isRequired ?? false,
      isUnique: input.isUnique ?? false,
      isMultiselect: input.isMultiselect ?? false,
      sortOrder: nextOrder,
    })
    .returning();

  return attr;
}

export async function updateAttribute(
  id: string,
  input: {
    title?: string;
    config?: Record<string, unknown>;
    isRequired?: boolean;
    isUnique?: boolean;
    isMultiselect?: boolean;
    sortOrder?: number;
  }
) {
  const attr = await getAttributeById(id);
  if (!attr) return null;

  const [updated] = await db
    .update(attributes)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.config !== undefined && { config: input.config }),
      ...(input.isRequired !== undefined && { isRequired: input.isRequired }),
      ...(input.isUnique !== undefined && { isUnique: input.isUnique }),
      ...(input.isMultiselect !== undefined && { isMultiselect: input.isMultiselect }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    })
    .where(eq(attributes.id, id))
    .returning();

  return updated;
}

export async function deleteAttribute(id: string) {
  const attr = await getAttributeById(id);
  if (!attr) return null;
  if (attr.isSystem) {
    throw new Error("Cannot delete system attributes");
  }

  await db.delete(attributes).where(eq(attributes.id, id));
  return attr;
}

// --- Select Options ---

export async function listSelectOptions(attributeId: string) {
  return db
    .select()
    .from(selectOptions)
    .where(eq(selectOptions.attributeId, attributeId))
    .orderBy(selectOptions.sortOrder);
}

export async function createSelectOption(
  attributeId: string,
  input: { title: string; color?: string }
) {
  const [result] = await db
    .select({ maxOrder: max(selectOptions.sortOrder) })
    .from(selectOptions)
    .where(eq(selectOptions.attributeId, attributeId));

  const nextOrder = (result?.maxOrder ?? -1) + 1;

  const [option] = await db
    .insert(selectOptions)
    .values({
      attributeId,
      title: input.title,
      color: input.color || "#6366f1",
      sortOrder: nextOrder,
    })
    .returning();

  return option;
}

export async function updateSelectOption(
  id: string,
  input: { title?: string; color?: string; sortOrder?: number }
) {
  const [updated] = await db
    .update(selectOptions)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    })
    .where(eq(selectOptions.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteSelectOption(id: string) {
  const rows = await db.select().from(selectOptions).where(eq(selectOptions.id, id)).limit(1);
  if (rows.length === 0) return null;

  await db.delete(selectOptions).where(eq(selectOptions.id, id));
  return rows[0];
}

// --- Statuses ---

export async function listStatuses(attributeId: string) {
  return db
    .select()
    .from(statuses)
    .where(eq(statuses.attributeId, attributeId))
    .orderBy(statuses.sortOrder);
}

export async function createStatus(
  attributeId: string,
  input: {
    title: string;
    color?: string;
    isActive?: boolean;
    celebrationEnabled?: boolean;
  }
) {
  const [result] = await db
    .select({ maxOrder: max(statuses.sortOrder) })
    .from(statuses)
    .where(eq(statuses.attributeId, attributeId));

  const nextOrder = (result?.maxOrder ?? -1) + 1;

  const [status] = await db
    .insert(statuses)
    .values({
      attributeId,
      title: input.title,
      color: input.color || "#6366f1",
      sortOrder: nextOrder,
      isActive: input.isActive ?? true,
      celebrationEnabled: input.celebrationEnabled ?? false,
    })
    .returning();

  return status;
}

export async function updateStatus(
  id: string,
  input: {
    title?: string;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
    celebrationEnabled?: boolean;
  }
) {
  const [updated] = await db
    .update(statuses)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.celebrationEnabled !== undefined && { celebrationEnabled: input.celebrationEnabled }),
    })
    .where(eq(statuses.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteStatus(id: string) {
  const rows = await db.select().from(statuses).where(eq(statuses.id, id)).limit(1);
  if (rows.length === 0) return null;

  await db.delete(statuses).where(eq(statuses.id, id));
  return rows[0];
}
