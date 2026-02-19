import type { AttributeType } from "./attribute-types";

export interface StandardAttribute {
  slug: string;
  title: string;
  type: AttributeType;
  isSystem: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isMultiselect: boolean;
  config?: Record<string, unknown>;
}

export interface StandardObject {
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  isAlwaysOn: boolean;
  attributes: StandardAttribute[];
}

export const STANDARD_OBJECTS: StandardObject[] = [
  {
    slug: "people",
    singularName: "Person",
    pluralName: "People",
    icon: "users",
    isAlwaysOn: true,
    attributes: [
      { slug: "name", title: "Name", type: "personal_name", isSystem: true, isRequired: true, isUnique: false, isMultiselect: false },
      { slug: "email_addresses", title: "Email Addresses", type: "email_address", isSystem: true, isRequired: false, isUnique: true, isMultiselect: true },
      { slug: "phone_numbers", title: "Phone Numbers", type: "phone_number", isSystem: true, isRequired: false, isUnique: false, isMultiselect: true },
      { slug: "job_title", title: "Job Title", type: "text", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "company", title: "Company", type: "record_reference", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false, config: { targetObjectSlug: "companies" } },
      { slug: "location", title: "Location", type: "location", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "description", title: "Description", type: "text", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
    ],
  },
  {
    slug: "companies",
    singularName: "Company",
    pluralName: "Companies",
    icon: "building-2",
    isAlwaysOn: true,
    attributes: [
      { slug: "name", title: "Name", type: "text", isSystem: true, isRequired: true, isUnique: true, isMultiselect: false },
      { slug: "domains", title: "Domains", type: "domain", isSystem: true, isRequired: false, isUnique: true, isMultiselect: true },
      { slug: "description", title: "Description", type: "text", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "team", title: "Team", type: "record_reference", isSystem: true, isRequired: false, isUnique: false, isMultiselect: true, config: { targetObjectSlug: "people" } },
      { slug: "primary_location", title: "Primary Location", type: "location", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "categories", title: "Categories", type: "select", isSystem: true, isRequired: false, isUnique: false, isMultiselect: true },
    ],
  },
  {
    slug: "deals",
    singularName: "Deal",
    pluralName: "Deals",
    icon: "handshake",
    isAlwaysOn: false,
    attributes: [
      { slug: "name", title: "Name", type: "text", isSystem: true, isRequired: true, isUnique: false, isMultiselect: false },
      { slug: "value", title: "Value", type: "currency", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "stage", title: "Stage", type: "status", isSystem: true, isRequired: true, isUnique: false, isMultiselect: false },
      { slug: "expected_close_date", title: "Expected Close Date", type: "date", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "owner", title: "Owner", type: "actor_reference", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false },
      { slug: "company", title: "Company", type: "record_reference", isSystem: true, isRequired: false, isUnique: false, isMultiselect: false, config: { targetObjectSlug: "companies" } },
      { slug: "associated_people", title: "Associated People", type: "record_reference", isSystem: true, isRequired: false, isUnique: false, isMultiselect: true, config: { targetObjectSlug: "people" } },
    ],
  },
];

export const DEAL_STAGES = [
  { title: "Lead", color: "#6366f1", sortOrder: 0, isActive: true, celebrationEnabled: false },
  { title: "Qualified", color: "#8b5cf6", sortOrder: 1, isActive: true, celebrationEnabled: false },
  { title: "Proposal", color: "#a855f7", sortOrder: 2, isActive: true, celebrationEnabled: false },
  { title: "Negotiation", color: "#d946ef", sortOrder: 3, isActive: true, celebrationEnabled: false },
  { title: "Won", color: "#22c55e", sortOrder: 4, isActive: false, celebrationEnabled: true },
  { title: "Lost", color: "#ef4444", sortOrder: 5, isActive: false, celebrationEnabled: false },
];
