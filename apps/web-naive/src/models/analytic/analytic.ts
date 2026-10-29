import type { MResult } from '#/models/common';

export namespace AnalyticApi {
  export type AnalyticDetailType =
    | 'TotalBytes'
    | 'TotalRequests'
    | 'UniqueVisitors';

  export interface AnalyticDetail {
    total24h?: null | number;
    totalInDay?: null | number;
    type?: AnalyticDetailType | null;
  }

  export interface AnalyticResultData {
    details?: AnalyticDetail[] | null;
  }

  export type AnalyticResult = MResult<AnalyticResultData>;

  export interface UserCount {
    totalUsers: number;
    currentTenantUsers: number;
  }

  export type UserCountResult = MResult<UserCount>;

  export interface OciOutboundParams {
    month: string;
    etenant: 'mrdua9x' | 'nguyettun97' | 'ynkdqe';
  }

  export interface OciUsageTotal {
    skuPartNumber: string;
    unit: string;
    quantity: number;
  }

  export interface OciUsageDaily extends OciUsageTotal {
    dateUtc: string;
  }

  export interface OciOutboundResponse {
    source: string;
    periodStartUtc: string;
    periodEndExclusiveUtc: string;
    fetchedAtUtc: string;
    filteredSkuPartNumbers: string[];
    daily: OciUsageDaily[];
    totals: OciUsageTotal[];
  }
}
