import "dotenv/config";
import postgres from "postgres";

/**
 * Migration script: Adds workspace_id to tasks table.
 * Run this BEFORE `drizzle-kit push` to backfill existing data.
 *
 * Usage: npx tsx src/db/migrate-workspaces.ts
 */
async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = postgres(connectionString);

  console.log("Starting workspace migration...");

  // Check if column already exists
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'workspace_id'
  `;

  if (cols.length > 0) {
    console.log("workspace_id column already exists on tasks table, checking if populated...");
    const nullCount = await sql`SELECT count(*) as cnt FROM tasks WHERE workspace_id IS NULL`;
    if (Number(nullCount[0].cnt) === 0) {
      console.log("All tasks already have workspace_id. Migration complete.");
      await sql.end();
      return;
    }
  } else {
    // Step 1: Add workspace_id as nullable
    console.log("Adding workspace_id column (nullable)...");
    await sql`ALTER TABLE tasks ADD COLUMN workspace_id text`;
  }

  // Step 2: Backfill — assign all tasks to the first workspace
  console.log("Backfilling workspace_id from first workspace...");
  const result = await sql`
    UPDATE tasks
    SET workspace_id = (SELECT id FROM workspaces LIMIT 1)
    WHERE workspace_id IS NULL
  `;
  console.log(`Updated ${result.count} tasks`);

  // Step 3: Make NOT NULL
  console.log("Setting NOT NULL constraint...");
  await sql`ALTER TABLE tasks ALTER COLUMN workspace_id SET NOT NULL`;

  // Step 4: Add FK (if not exists)
  try {
    await sql`
      ALTER TABLE tasks ADD CONSTRAINT tasks_workspace_id_workspaces_id_fk
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE cascade
    `;
    console.log("Added FK constraint");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) {
      console.log("FK constraint already exists");
    } else {
      throw e;
    }
  }

  // Step 5: Add index (if not exists)
  await sql`CREATE INDEX IF NOT EXISTS tasks_workspace_id ON tasks USING btree (workspace_id)`;
  console.log("Added index");

  console.log("Migration complete!");
  await sql.end();
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
