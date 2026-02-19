export interface RecordValue {
  id: string;
  recordId: string;
  attributeId: string;
  textValue: string | null;
  numberValue: number | null;
  dateValue: string | null;
  timestampValue: string | null;
  booleanValue: boolean | null;
  jsonValue: unknown | null;
  referencedRecordId: string | null;
  actorId: string | null;
  sortOrder: number;
  createdAt: string;
  createdBy: string | null;
}

export interface CrmRecord {
  id: string;
  objectId: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  values: Record<string, RecordValue[]>;
}

export interface CreateRecordInput {
  values: Record<string, unknown>;
}

export interface UpdateRecordInput {
  values: Record<string, unknown>;
}

/** Location value stored in json_value */
export interface LocationValue {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  countryCode?: string;
}

/** Personal name value stored in json_value */
export interface PersonalNameValue {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

/** Currency value stored in json_value */
export interface CurrencyValue {
  amount: number;
  currencyCode: string;
}
