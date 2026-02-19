-- Step 1: Add workspace_id as nullable
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "workspace_id" text;

-- Step 2: Backfill - assign all existing tasks to the first workspace
UPDATE "tasks"
SET "workspace_id" = (SELECT "id" FROM "workspaces" LIMIT 1)
WHERE "workspace_id" IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE "tasks" ALTER COLUMN "workspace_id" SET NOT NULL;

-- Step 4: Add FK constraint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE cascade ON UPDATE no action;

-- Step 5: Add index
CREATE INDEX IF NOT EXISTS "tasks_workspace_id" ON "tasks" USING btree ("workspace_id");
