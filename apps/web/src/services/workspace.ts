import { db } from "@/db";
import { workspaces, workspaceMembers, users, objects, attributes, statuses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { STANDARD_OBJECTS, DEAL_STAGES } from "@openclaw-crm/shared";

// ─── Workspace ───────────────────────────────────────────────────────

export async function getWorkspace(workspaceId: string) {
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateWorkspace(
  workspaceId: string,
  input: { name?: string; settings?: Record<string, unknown> }
) {
  const [updated] = await db
    .update(workspaces)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.settings !== undefined && { settings: input.settings }),
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId))
    .returning();
  return updated;
}

/** Create a new workspace with the creator as admin, and seed standard objects */
export async function createWorkspace(name: string, userId: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "workspace";

  // Ensure slug uniqueness by appending random suffix
  const existingSlugs = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  const finalSlug = existingSlugs.length > 0
    ? `${slug}-${crypto.randomUUID().slice(0, 8)}`
    : slug;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name,
      slug: finalSlug,
      settings: {},
    })
    .returning();

  // Add creator as admin
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "admin",
  });

  // Seed standard objects
  await seedWorkspaceObjects(workspace.id);

  return workspace;
}

/** List all workspaces a user is a member of */
export async function listUserWorkspaces(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: workspaceMembers.role,
      createdAt: workspaces.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.createdAt);
}

/** Seed standard objects (People, Companies, Deals) + attributes + deal stages for a workspace */
export async function seedWorkspaceObjects(workspaceId: string) {
  for (const stdObj of STANDARD_OBJECTS) {
    const [object] = await db
      .insert(objects)
      .values({
        workspaceId,
        slug: stdObj.slug,
        singularName: stdObj.singularName,
        pluralName: stdObj.pluralName,
        icon: stdObj.icon,
        isSystem: true,
      })
      .returning();

    for (let i = 0; i < stdObj.attributes.length; i++) {
      const attr = stdObj.attributes[i];
      const [attribute] = await db
        .insert(attributes)
        .values({
          objectId: object.id,
          slug: attr.slug,
          title: attr.title,
          type: attr.type,
          config: attr.config || {},
          isSystem: attr.isSystem,
          isRequired: attr.isRequired,
          isUnique: attr.isUnique,
          isMultiselect: attr.isMultiselect,
          sortOrder: i,
        })
        .returning();

      // Create deal stages for the "stage" status attribute
      if (stdObj.slug === "deals" && attr.slug === "stage") {
        for (const stage of DEAL_STAGES) {
          await db.insert(statuses).values({
            attributeId: attribute.id,
            title: stage.title,
            color: stage.color,
            sortOrder: stage.sortOrder,
            isActive: stage.isActive,
            celebrationEnabled: stage.celebrationEnabled,
          });
        }
      }
    }
  }
}

// ─── Members ─────────────────────────────────────────────────────────

export async function listMembers(workspaceId: string) {
  return db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      createdAt: workspaceMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(workspaceMembers.createdAt);
}

export async function addMemberByEmail(
  workspaceId: string,
  email: string,
  role: "admin" | "member" = "member"
) {
  // Find user by email
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (userRows.length === 0) {
    throw new Error("No user found with that email address");
  }

  const user = userRows[0];

  // Check if already a member
  const existing = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User is already a member of this workspace");
  }

  const [member] = await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId: user.id, role })
    .returning();

  return {
    ...member,
    userName: user.name,
    userEmail: user.email,
    userImage: user.image,
  };
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: "admin" | "member"
) {
  const [updated] = await db
    .update(workspaceMembers)
    .set({ role })
    .where(
      and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function removeMember(workspaceId: string, memberId: string) {
  const rows = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  // Don't allow removing the last admin
  if (rows[0].role === "admin") {
    const adminCount = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, "admin")
        )
      );
    if (adminCount.length <= 1) {
      throw new Error("Cannot remove the last admin");
    }
  }

  await db
    .delete(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId));

  return rows[0];
}
