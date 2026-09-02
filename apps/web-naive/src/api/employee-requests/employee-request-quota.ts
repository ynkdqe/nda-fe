import type { EmployeeRequestQuotaApi } from '#/models/employee-requests/employee-request-quota';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request-quota';

export function getEmployeeRequestQuotaListApi(
  params: EmployeeRequestQuotaApi.ListParams,
) {
  return requestClient.get<EmployeeRequestQuotaApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function updateEmployeeRequestQuotaApi(
  id: number,
  data: EmployeeRequestQuotaApi.UpdateInput,
) {
  return requestClient.put<EmployeeRequestQuotaApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function generateEmployeeRequestQuotaApi(
  data: EmployeeRequestQuotaApi.GenerateInput,
) {
  return requestClient.post<EmployeeRequestQuotaApi.MutationResult>(
    `${PREFIX}/generate`,
    data,
    { responseReturn: 'body' },
  );
}
