export interface MResult<TData, TDataExtend = unknown> {
  current?: null | number;
  data?: null | TData;
  dataExtend?: null | TDataExtend;
  message?: null | string;
  pageSize?: null | number;
  success: boolean;
  total?: null | number;
}
