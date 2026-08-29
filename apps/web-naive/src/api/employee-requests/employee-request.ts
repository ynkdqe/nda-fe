import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request';

export function getEmployeeRequestListApi(params: EmployeeRequestApi.ListParams) {
  return requestClient.get<EmployeeRequestApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getEmployeeRequestByIdApi(id: number) {
  return requestClient.get<EmployeeRequestApi.DetailResult>(`${PREFIX}/${id}`, {
    responseReturn: 'body',
  });
}

export function createEmployeeRequestApi(data: EmployeeRequestApi.CreateInput) {
  return requestClient.post<EmployeeRequestApi.MutationResult>(PREFIX, data, {
    responseReturn: 'body',
  });
}

export function updateEmployeeRequestApi(
  id: number,
  data: EmployeeRequestApi.UpdateInput,
) {
  return requestClient.put<EmployeeRequestApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteEmployeeRequestApi(id: number) {
  return requestClient.delete<EmployeeRequestApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function approveEmployeeRequestApi(id: number) {
  return requestClient.put<EmployeeRequestApi.MutationResult>(
    `${PREFIX}/${id}/approve`,
    undefined,
    { responseReturn: 'body' },
  );
}

export function rejectEmployeeRequestApi(
  id: number,
  data: EmployeeRequestApi.RejectInput,
) {
  return requestClient.put<EmployeeRequestApi.MutationResult>(
    `${PREFIX}/${id}/reject`,
    data,
    { responseReturn: 'body' },
  );
}

export function cancelEmployeeRequestApi(id: number) {
  return requestClient.put<EmployeeRequestApi.MutationResult>(
    `${PREFIX}/${id}/cancel`,
    undefined,
    { responseReturn: 'body' },
  );
}

export function getEmployeeRequestQuotaApi(
  params: EmployeeRequestApi.QuotaParams,
) {
  return requestClient.get<EmployeeRequestApi.QuotaResult>(`${PREFIX}/quota`, {
    params,
    responseReturn: 'body',
  });
}
