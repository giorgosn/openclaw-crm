import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { STANDARD_OBJECTS, DEAL_STAGES } from "@openclaw-crm/shared";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Check if a workspace already exists
  const existingWorkspaces = await db.select().from(schema.workspaces).limit(1);
  if (existingWorkspaces.length > 0) {
    console.log("Database already seeded, skipping...");
    await client.end();
    return;
  }

  // Create default workspace
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      name: "My Workspace",
      slug: "my-workspace",
      settings: {},
    })
    .returning();

  console.log(`Created workspace: ${workspace.name}`);

  // Seed standard objects (same logic as seedWorkspaceObjects in services/workspace.ts)
  for (const stdObj of STANDARD_OBJECTS) {
    const [object] = await db
      .insert(schema.objects)
      .values({
        workspaceId: workspace.id,
        slug: stdObj.slug,
        singularName: stdObj.singularName,
        pluralName: stdObj.pluralName,
        icon: stdObj.icon,
        isSystem: true,
      })
      .returning();

    console.log(`Created object: ${object.pluralName}`);

    for (let i = 0; i < stdObj.attributes.length; i++) {
      const attr = stdObj.attributes[i];
      const [attribute] = await db
        .insert(schema.attributes)
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

      console.log(`  Created attribute: ${attribute.title} (${attribute.type})`);

      if (stdObj.slug === "deals" && attr.slug === "stage") {
        for (const stage of DEAL_STAGES) {
          await db.insert(schema.statuses).values({
            attributeId: attribute.id,
            title: stage.title,
            color: stage.color,
            sortOrder: stage.sortOrder,
            isActive: stage.isActive,
            celebrationEnabled: stage.celebrationEnabled,
          });
        }
        console.log(`  Created ${DEAL_STAGES.length} deal stages`);
      }
    }
  }

  console.log("Seeding complete!");
  await client.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
