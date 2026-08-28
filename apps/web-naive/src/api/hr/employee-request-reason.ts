import type { EmployeeRequestReasonApi } from '#/models/hr/employee-request-reason';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request-reason';

export function getEmployeeRequestReasonListApi(
  params: EmployeeRequestReasonApi.ListParams,
) {
  return requestClient.get<EmployeeRequestReasonApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getEmployeeRequestReasonByIdApi(id: number) {
  return requestClient.get<EmployeeRequestReasonApi.DetailResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function createEmployeeRequestReasonApi(
  data: EmployeeRequestReasonApi.CreateInput,
) {
  return requestClient.post<EmployeeRequestReasonApi.MutationResult>(
    PREFIX,
    data,
    {
      responseReturn: 'body',
    },
  );
}

export function updateEmployeeRequestReasonApi(
  id: number,
  data: EmployeeRequestReasonApi.UpdateInput,
) {
  return requestClient.put<EmployeeRequestReasonApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteEmployeeRequestReasonApi(id: number) {
  return requestClient.delete<EmployeeRequestReasonApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function deleteManyEmployeeRequestReasonsApi(ids: number[]) {
  return requestClient.post<EmployeeRequestReasonApi.MutationResult>(
    `${PREFIX}/delete-many`,
    { ids },
    { responseReturn: 'body' },
  );
}
