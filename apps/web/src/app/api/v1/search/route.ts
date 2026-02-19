import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest, success } from "@/lib/api-utils";
import { globalSearch } from "@/services/search";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return unauthorized();

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return badRequest("Query parameter 'q' is required");

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10),
    50
  );

  const results = await globalSearch(auth.workspaceId, q, { limit });
  return success(results);
}
