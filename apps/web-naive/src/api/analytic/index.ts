import type { AnalyticApi } from '#/models/analytic';

import { requestClient } from '#/api/request';

export async function getAnalyticApi() {
  return requestClient.get<AnalyticApi.AnalyticResult>('/api/analytic', {
    responseReturn: 'body',
  });
}
