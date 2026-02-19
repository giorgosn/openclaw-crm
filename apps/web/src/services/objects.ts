import { db } from "@/db";
import { objects, attributes, selectOptions, statuses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function listObjects(workspaceId: string) {
  return db
    .select()
    .from(objects)
    .where(eq(objects.workspaceId, workspaceId))
    .orderBy(objects.createdAt);
}

export async function getObjectBySlug(workspaceId: string, slug: string) {
  const rows = await db
    .select()
    .from(objects)
    .where(and(eq(objects.workspaceId, workspaceId), eq(objects.slug, slug)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getObjectById(workspaceId: string, id: string) {
  const rows = await db
    .select()
    .from(objects)
    .where(and(eq(objects.workspaceId, workspaceId), eq(objects.id, id)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getObjectWithAttributes(workspaceId: string, slug: string) {
  const obj = await getObjectBySlug(workspaceId, slug);
  if (!obj) return null;

  const attrs = await db
    .select()
    .from(attributes)
    .where(eq(attributes.objectId, obj.id))
    .orderBy(attributes.sortOrder);

  // For select/status attributes, also fetch their options
  const attrsWithOptions = await Promise.all(
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

  return { ...obj, attributes: attrsWithOptions };
}

export async function createObject(
  workspaceId: string,
  input: {
    slug: string;
    singularName: string;
    pluralName: string;
    icon?: string;
  }
) {
  const [obj] = await db
    .insert(objects)
    .values({
      workspaceId,
      slug: input.slug,
      singularName: input.singularName,
      pluralName: input.pluralName,
      icon: input.icon || "box",
      isSystem: false,
    })
    .returning();

  return obj;
}

export async function updateObject(
  workspaceId: string,
  slug: string,
  input: {
    singularName?: string;
    pluralName?: string;
    icon?: string;
  }
) {
  const obj = await getObjectBySlug(workspaceId, slug);
  if (!obj) return null;

  const [updated] = await db
    .update(objects)
    .set({
      ...(input.singularName !== undefined && { singularName: input.singularName }),
      ...(input.pluralName !== undefined && { pluralName: input.pluralName }),
      ...(input.icon !== undefined && { icon: input.icon }),
    })
    .where(eq(objects.id, obj.id))
    .returning();

  return updated;
}

export async function deleteObject(workspaceId: string, slug: string) {
  const obj = await getObjectBySlug(workspaceId, slug);
  if (!obj) return null;
  if (obj.isSystem) {
    throw new Error("Cannot delete system objects");
  }

  await db.delete(objects).where(eq(objects.id, obj.id));
  return obj;
}
