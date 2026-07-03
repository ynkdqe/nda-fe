import type { TimesheetApi } from '#/models/hr/timesheet';

import { requestClient } from '#/api/request';

export async function getTimesheetListApi(params?: TimesheetApi.TimesheetListParams) {
  return requestClient.get<TimesheetApi.TimesheetListResult>('/api/timesheets', {
    params,
    responseReturn: 'body',
  });
}

export function syncTimesheetsApi(period: string) {
  return requestClient.get('/api/timesheets/gg-sync', {
    params: { period },
    responseReturn: 'body',
  });
}

export function syncTimesheetsV2Api(period: string) {
  return requestClient.get('/api/timesheets/gg-sync-v2', {
    params: { period },
    responseReturn: 'body',
  });
}
