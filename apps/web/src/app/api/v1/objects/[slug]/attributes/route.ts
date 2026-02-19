import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import {
  listAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createSelectOption,
  updateSelectOption,
  deleteSelectOption,
  createStatus,
  updateStatus,
  deleteStatus,
} from "@/services/attributes";
import { ATTRIBUTE_TYPES } from "@openclaw-crm/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  const data = await listAttributes(obj.id);
  return success(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug: objectSlug } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, objectSlug);
  if (!obj) return notFound("Object not found");

  const body = await req.json();
  const { slug, title, type, config, isRequired, isUnique, isMultiselect, options, statuses: statusList } = body;

  if (!slug || !title || !type) {
    return badRequest("slug, title, and type are required");
  }

  if (!ATTRIBUTE_TYPES.includes(type)) {
    return badRequest(`Invalid attribute type. Must be one of: ${ATTRIBUTE_TYPES.join(", ")}`);
  }

  try {
    const attr = await createAttribute(obj.id, {
      slug,
      title,
      type,
      config,
      isRequired,
      isUnique,
      isMultiselect,
    });

    // Create initial options for select attributes
    if (type === "select" && Array.isArray(options)) {
      for (const opt of options) {
        await createSelectOption(attr.id, { title: opt.title, color: opt.color });
      }
    }

    // Create initial statuses for status attributes
    if (type === "status" && Array.isArray(statusList)) {
      for (const s of statusList) {
        await createStatus(attr.id, {
          title: s.title,
          color: s.color,
          isActive: s.isActive,
          celebrationEnabled: s.celebrationEnabled,
        });
      }
    }

    return success(attr, 201);
  } catch (e: any) {
    if (e.code === "23505") {
      return badRequest("An attribute with this slug already exists on this object");
    }
    throw e;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { attributeId, ...input } = body;

  if (!attributeId) {
    return badRequest("attributeId is required");
  }

  try {
    const updated = await updateAttribute(attributeId, input);
    if (!updated) return notFound("Attribute not found");
    return success(updated);
  } catch (e: any) {
    if (e.message === "Cannot delete system attributes") {
      return badRequest(e.message);
    }
    throw e;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const attributeId = searchParams.get("attributeId");

  if (!attributeId) {
    return badRequest("attributeId query parameter is required");
  }

  try {
    const deleted = await deleteAttribute(attributeId);
    if (!deleted) return notFound("Attribute not found");
    return success(deleted);
  } catch (e: any) {
    if (e.message === "Cannot delete system attributes") {
      return badRequest(e.message);
    }
    throw e;
  }
}
