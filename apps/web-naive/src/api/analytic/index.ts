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

export async function getAnalyticApi() {
  return requestClient.get<AnalyticApi.AnalyticResult>('/api/analytic', {
    responseReturn: 'body',
  });
}
