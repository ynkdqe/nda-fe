

export type HrId = number | string;
export type NullableHrId = HrId | null;
export type NullableNumber = null | number;
export type NullableString = null | string;
export type NullableValue = null | number | string;
export type UnknownRecord = Record<string, unknown>;

export interface IdLabelOption {
  label: string;
  value: HrId;
}

export interface MErrorValidationItem {
  members?: string[];
  message?: null | string;
}

export interface MErrorDetail {
  code?: null | string;
  data?: null | UnknownRecord;
  details?: null | string;
  message?: null | string;
  validationErrors?: MErrorValidationItem[];
}

export interface MError {
  error?: MErrorDetail | null;
}

