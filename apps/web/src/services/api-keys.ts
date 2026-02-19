import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): string {
  const bytes = randomBytes(24);
  return `oc_sk_${bytes.toString("hex")}`;
}

export async function createApiKey(
  workspaceId: string,
  userId: string,
  options: { name: string; scopes?: string[]; expiresAt?: Date }
) {
  const fullKey = generateApiKey();
  const keyHash = hashKey(fullKey);
  const keyPrefix = fullKey.slice(0, 14) + "...";

  const [created] = await db
    .insert(apiKeys)
    .values({
      keyPrefix,
      keyHash,
      name: options.name,
      workspaceId,
      userId,
      scopes: JSON.stringify(options.scopes ?? ["*"]),
      expiresAt: options.expiresAt ?? null,
    })
    .returning();

  return {
    id: created.id,
    key: fullKey,
    keyPrefix,
    name: created.name,
    scopes: JSON.parse(created.scopes),
    expiresAt: created.expiresAt,
    createdAt: created.createdAt,
  };
}

export async function listApiKeys(workspaceId: string) {
  const keys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.workspaceId, workspaceId), isNull(apiKeys.revokedAt)))
    .orderBy(apiKeys.createdAt);

  return keys.map((k) => ({
    ...k,
    scopes: JSON.parse(k.scopes),
  }));
}

export async function revokeApiKey(keyId: string, workspaceId: string) {
  const result = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.workspaceId, workspaceId),
        isNull(apiKeys.revokedAt)
      )
    )
    .returning({ id: apiKeys.id });

  return result.length > 0;
}
