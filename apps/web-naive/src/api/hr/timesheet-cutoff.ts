import type { TimesheetCutoffApi } from '#/models/hr/timesheet-cutoff';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/timesheet-cutoff';

export function getTimesheetCutoffListApi(params: TimesheetCutoffApi.ListParams) {
  return requestClient.get<TimesheetCutoffApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getTimesheetCutoffByIdApi(id: number) {
  return requestClient.get<TimesheetCutoffApi.DetailResult>(`${PREFIX}/${id}`, {
    responseReturn: 'body',
  });
}

export function createTimesheetCutoffApi(data: TimesheetCutoffApi.CreateInput) {
  return requestClient.post<TimesheetCutoffApi.MutationResult>(PREFIX, data, {
    responseReturn: 'body',
  });
}

export function updateTimesheetCutoffApi(
  id: number,
  data: TimesheetCutoffApi.UpdateInput,
) {
  return requestClient.put<TimesheetCutoffApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteTimesheetCutoffApi(id: number) {
  return requestClient.delete<TimesheetCutoffApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}
