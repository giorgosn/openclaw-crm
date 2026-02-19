import type { Attribute } from "./attributes";

export interface CrmObject {
  id: string;
  workspaceId: string;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  isSystem: boolean;
  createdAt: string;
}

export interface CrmObjectWithAttributes extends CrmObject {
  attributes: Attribute[];
}

export interface CreateObjectInput {
  slug: string;
  singularName: string;
  pluralName: string;
  icon?: string;
}
