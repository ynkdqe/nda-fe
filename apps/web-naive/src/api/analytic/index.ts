import type { AnalyticApi } from '#/models/analytic';

import { requestClient } from '#/api/request';

export function getAnalyticUserCountApi() {
  return requestClient.get<AnalyticApi.UserCountResult>(
    '/api/analytic/user-count',
    {
      responseReturn: 'body',
    },
  );
}

export function getOciOutboundApi(
  params: AnalyticApi.OciOutboundParams,
  signal?: AbortSignal,
) {
  return requestClient.get<AnalyticApi.OciOutboundResponse>(
    '/api/analytic/oci/outbound',
    { params, responseReturn: 'body', signal },
  );
}

export function getOciHourlyChartApi(
  params: AnalyticApi.OciHourlyChartParams,
  signal?: AbortSignal,
) {
  return requestClient.get<AnalyticApi.OciHourlyChartResponse>(
    '/api/analytic/oci/outbound/hourly-chart',
    { params, responseReturn: 'body', signal },
  );
}

export async function getAnalyticApi() {
  return requestClient.get<AnalyticApi.AnalyticResult>('/api/analytic', {
    responseReturn: 'body',
  });
}
