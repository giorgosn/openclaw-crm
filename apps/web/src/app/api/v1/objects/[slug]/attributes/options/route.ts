import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success } from "@/lib/api-utils";
import {
  getAttributeById,
  listSelectOptions,
  createSelectOption,
  updateSelectOption,
  deleteSelectOption,
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "@/services/attributes";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const attributeId = searchParams.get("attributeId");
  if (!attributeId) return badRequest("attributeId is required");

  const attr = await getAttributeById(attributeId);
  if (!attr) return notFound("Attribute not found");

  if (attr.type === "select") {
    const data = await listSelectOptions(attributeId);
    return success(data);
  }
  if (attr.type === "status") {
    const data = await listStatuses(attributeId);
    return success(data);
  }

  return badRequest("Attribute is not a select or status type");
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { attributeId, title, color, isActive, celebrationEnabled } = body;

  if (!attributeId || !title) {
    return badRequest("attributeId and title are required");
  }

  const attr = await getAttributeById(attributeId);
  if (!attr) return notFound("Attribute not found");

  if (attr.type === "select") {
    const option = await createSelectOption(attributeId, { title, color });
    return success(option, 201);
  }
  if (attr.type === "status") {
    const status = await createStatus(attributeId, { title, color, isActive, celebrationEnabled });
    return success(status, 201);
  }

  return badRequest("Attribute is not a select or status type");
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { optionId, attributeType, ...input } = body;

  if (!optionId || !attributeType) {
    return badRequest("optionId and attributeType are required");
  }

  if (attributeType === "select") {
    const updated = await updateSelectOption(optionId, input);
    if (!updated) return notFound("Option not found");
    return success(updated);
  }
  if (attributeType === "status") {
    const updated = await updateStatus(optionId, input);
    if (!updated) return notFound("Status not found");
    return success(updated);
  }

  return badRequest("attributeType must be 'select' or 'status'");
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const optionId = searchParams.get("optionId");
  const attributeType = searchParams.get("attributeType");

  if (!optionId || !attributeType) {
    return badRequest("optionId and attributeType query parameters are required");
  }

  if (attributeType === "select") {
    const deleted = await deleteSelectOption(optionId);
    if (!deleted) return notFound("Option not found");
    return success(deleted);
  }
  if (attributeType === "status") {
    const deleted = await deleteStatus(optionId);
    if (!deleted) return notFound("Status not found");
    return success(deleted);
  }

  return badRequest("attributeType must be 'select' or 'status'");
}
