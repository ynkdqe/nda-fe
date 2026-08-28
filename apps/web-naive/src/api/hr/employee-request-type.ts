import type { EmployeeRequestTypeApi } from '#/models/hr/employee-request-type';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request-type';

export function getEmployeeRequestTypeListApi(
  params: EmployeeRequestTypeApi.ListParams,
) {
  return requestClient.get<EmployeeRequestTypeApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getEmployeeRequestTypeByIdApi(id: number) {
  return requestClient.get<EmployeeRequestTypeApi.DetailResult>(
    `${PREFIX}/${id}`,
    {
      responseReturn: 'body',
    },
  );
}

export function createEmployeeRequestTypeApi(
  data: EmployeeRequestTypeApi.CreateInput,
) {
  return requestClient.post<EmployeeRequestTypeApi.MutationResult>(
    PREFIX,
    data,
    {
      responseReturn: 'body',
    },
  );
}

export function updateEmployeeRequestTypeApi(
  id: number,
  data: EmployeeRequestTypeApi.UpdateInput,
) {
  return requestClient.put<EmployeeRequestTypeApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteEmployeeRequestTypeApi(id: number) {
  return requestClient.delete<EmployeeRequestTypeApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function deleteManyEmployeeRequestTypesApi(ids: number[]) {
  return requestClient.post<EmployeeRequestTypeApi.MutationResult>(
    `${PREFIX}/delete-many`,
    { ids },
    { responseReturn: 'body' },
  );
}
