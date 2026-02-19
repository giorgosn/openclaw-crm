import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest, notFound, success } from "@/lib/api-utils";
import {
  getListAttributes,
  createListAttribute,
  updateListAttribute,
  deleteListAttribute,
  verifyListWorkspace,
} from "@/services/lists";

/** GET /api/v1/lists/[listId]/attributes */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const attrs = await getListAttributes(listId);
  return success(attrs);
}

/** POST /api/v1/lists/[listId]/attributes */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const body = await req.json();

  if (!body.slug || !body.title || !body.type) {
    return badRequest("slug, title, and type are required");
  }

  const attr = await createListAttribute(listId, body);
  return success(attr, 201);
}

/** PATCH /api/v1/lists/[listId]/attributes — Update attribute (pass id in body) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const body = await req.json();
  if (!body.id) return badRequest("id is required");

  const attr = await updateListAttribute(body.id, body);
  if (!attr) return notFound("Attribute not found");
  return success(attr);
}

/** DELETE /api/v1/lists/[listId]/attributes — Delete attribute (pass id in body) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { listId } = await params;
  if (!(await verifyListWorkspace(listId, ctx.workspaceId))) {
    return notFound("List not found");
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id query param is required");

  const attr = await deleteListAttribute(id);
  if (!attr) return notFound("Attribute not found");
  return success({ deleted: true });
}
