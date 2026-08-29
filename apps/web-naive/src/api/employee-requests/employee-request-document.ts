import type { EmployeeRequestDocumentApi } from '#/models/employee-requests/employee-request-document';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request-document';

export function getEmployeeRequestDocumentListApi(
  params: EmployeeRequestDocumentApi.ListParams,
) {
  return requestClient.get<EmployeeRequestDocumentApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function createEmployeeRequestDocumentApi(
  data: EmployeeRequestDocumentApi.CreateInput,
) {
  return requestClient.post<EmployeeRequestDocumentApi.MutationResult>(
    PREFIX,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteEmployeeRequestDocumentApi(id: number) {
  return requestClient.delete<EmployeeRequestDocumentApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}
