import type { AttributeType } from "../constants/attribute-types";

export interface Attribute {
  id: string;
  objectId: string;
  slug: string;
  title: string;
  type: AttributeType;
  config: Record<string, unknown>;
  isSystem: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isMultiselect: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface SelectOption {
  id: string;
  attributeId: string;
  title: string;
  color: string;
  sortOrder: number;
}

export interface Status {
  id: string;
  attributeId: string;
  title: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  celebrationEnabled: boolean;
}

export interface CreateAttributeInput {
  slug: string;
  title: string;
  type: AttributeType;
  config?: Record<string, unknown>;
  isRequired?: boolean;
  isUnique?: boolean;
  isMultiselect?: boolean;
}
