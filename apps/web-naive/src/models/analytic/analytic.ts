export namespace AnalyticApi {
  export interface MResult<T extends object> {
    current?: null | number;
    data?: null | T;
    dataExtend?: unknown;
    message?: null | string;
    pageSize?: null | number;
    success: boolean;
    total?: null | number;
  }

  export type AnalyticDetailType = 'TotalBytes' | 'TotalRequests' | 'UniqueVisitors';

  export interface AnalyticDetail {
    total24h?: null | number;
    totalInDay?: null | number;
    type?: AnalyticDetailType | null;
  }

  export interface AnalyticResultData {
    details?: null | AnalyticDetail[];
  }

  export type AnalyticResult = MResult<AnalyticResultData>;
}
