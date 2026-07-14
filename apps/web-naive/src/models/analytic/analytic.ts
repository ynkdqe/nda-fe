import type { MResult } from '#/models/common';

export namespace AnalyticApi {

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
