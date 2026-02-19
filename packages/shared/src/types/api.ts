/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T;
}

/** Standard API list response */
export interface ApiListResponse<T> {
  data: T[];
  pagination?: {
    offset: number;
    limit: number;
    total: number;
  };
}

/** Standard API error response */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Filter condition for querying records */
export interface FilterCondition {
  attribute: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equals"
    | "less_than_or_equals"
    | "is_empty"
    | "is_not_empty"
    | "in"
    | "not_in";
  value?: unknown;
}

export interface FilterGroup {
  operator: "and" | "or";
  conditions: (FilterCondition | FilterGroup)[];
}

export interface SortConfig {
  attribute: string;
  direction: "asc" | "desc";
}

export interface QueryParams {
  filter?: FilterGroup;
  sorts?: SortConfig[];
  offset?: number;
  limit?: number;
}
