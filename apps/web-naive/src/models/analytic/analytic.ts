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
    month: number;
    year: number;
    etenant: 'mrdua9x' | 'nguyettun97' | 'ynkdqe';
  }

  export type OciHourlyChartParams = Pick<OciOutboundParams, 'etenant'>;

  export interface OciHourlyCategoryAxis {
    type: 'category';
    data: string[];
  }

  export interface OciHourlyValueAxis {
    type: 'value';
  }

  export interface OciHourlySeries {
    name: string;
    data: (null | number)[];
    datesUtc: string[];
    type: 'line';
    smooth: boolean;
    areaStyle: Record<string, never>;
  }

  export interface OciHourlyChartResponse {
    xAxis: OciHourlyCategoryAxis;
    yAxis: OciHourlyValueAxis;
    series: OciHourlySeries[];
    skuPartNumber: string;
    unit: string;
    timeZone: string;
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
