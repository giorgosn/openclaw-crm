export const ATTRIBUTE_TYPES = [
  "text",
  "number",
  "currency",
  "date",
  "timestamp",
  "checkbox",
  "select",
  "status",
  "rating",
  "email_address",
  "phone_number",
  "domain",
  "location",
  "personal_name",
  "record_reference",
  "actor_reference",
  "interaction",
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/** Maps attribute types to which typed column they use in record_values */
export const ATTRIBUTE_TYPE_COLUMN_MAP: Record<
  AttributeType,
  "text_value" | "number_value" | "date_value" | "timestamp_value" | "boolean_value" | "json_value" | "referenced_record_id"
> = {
  text: "text_value",
  number: "number_value",
  currency: "json_value", // { amount: number, currency: string }
  date: "date_value",
  timestamp: "timestamp_value",
  checkbox: "boolean_value",
  select: "text_value", // stores option ID
  status: "text_value", // stores status ID
  rating: "number_value",
  email_address: "text_value",
  phone_number: "text_value",
  domain: "text_value",
  location: "json_value", // { line1, line2, city, state, postcode, country }
  personal_name: "json_value", // { first_name, last_name, full_name }
  record_reference: "referenced_record_id",
  actor_reference: "text_value", // stores user ID
  interaction: "json_value", // { type, date, ... }
};
