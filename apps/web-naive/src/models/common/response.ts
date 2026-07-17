export interface MValidationError {
  members?: null | string[];
  message?: null | string;
}

export interface MError<TData = unknown> {
  code?: null | string;
  data?: null | TData;
  details?: null | string;
  message?: null | string;
  validationErrors?: null | MValidationError[];
}

export interface MResult<
  TData,
  TDataExtend = unknown,
  TErrorData = unknown,
> {
  current?: null | number;
  data?: null | TData;
  dataExtend?: null | TDataExtend;
  error?: null | MError<TErrorData>;
  message?: null | string;
  pageSize?: null | number;
  success: boolean;
  total?: null | number;
}
