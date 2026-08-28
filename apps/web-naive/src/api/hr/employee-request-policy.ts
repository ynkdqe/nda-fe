import type { EmployeeRequestPolicyApi } from '#/models/hr/employee-request-policy';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/employee-request-policy';

export function getEmployeeRequestPolicyListApi(
  params: EmployeeRequestPolicyApi.ListParams,
) {
  return requestClient.get<EmployeeRequestPolicyApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getEmployeeRequestPolicyByIdApi(id: number) {
  return requestClient.get<EmployeeRequestPolicyApi.DetailResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function createEmployeeRequestPolicyApi(
  data: EmployeeRequestPolicyApi.CreateInput,
) {
  return requestClient.post<EmployeeRequestPolicyApi.MutationResult>(
    PREFIX,
    data,
    {
      responseReturn: 'body',
    },
  );
}

export function updateEmployeeRequestPolicyApi(
  id: number,
  data: EmployeeRequestPolicyApi.UpdateInput,
) {
  return requestClient.put<EmployeeRequestPolicyApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    { responseReturn: 'body' },
  );
}

export function deleteEmployeeRequestPolicyApi(id: number) {
  return requestClient.delete<EmployeeRequestPolicyApi.MutationResult>(
    `${PREFIX}/${id}`,
    { responseReturn: 'body' },
  );
}

export function deleteManyEmployeeRequestPoliciesApi(ids: number[]) {
  return requestClient.post<EmployeeRequestPolicyApi.MutationResult>(
    `${PREFIX}/delete-many`,
    { ids },
    { responseReturn: 'body' },
  );
}
