import type { ContractTypeApi } from '#/models/hr/contract-type';

import { requestClient } from '#/api/request';

export async function getContractTypeListApi(
  params: ContractTypeApi.ContractTypeListParams,
) {
  return requestClient.get<ContractTypeApi.ContractTypeListResult>(
    '/api/hrms/contract-type',
    {
      params,
      responseReturn: 'body',
    },
  );
}

export async function getContractTypeByIdApi(id: number | string) {
  return requestClient.get<ContractTypeApi.ContractTypeDetailResult>(
    `/api/hrms/contract-type/${id}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function createContractTypeApi(data: Record<string, any>) {
  return requestClient.post('/api/hrms/contract-type', data, {
    responseReturn: 'body',
  });
}

export async function updateContractTypeApi(
  id: number | string,
  data: Record<string, any>,
) {
  return requestClient.put(`/api/hrms/contract-type/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteContractTypeApi(id: number | string) {
  return requestClient.delete(`/api/hrms/contract-type/${id}`, {
    responseReturn: 'body',
  });
}

export async function updateContractTypeDurationsApi(
  contractTypeId: number | string,
  durations: ContractTypeApi.DurationItem[],
) {
  return requestClient.put(
    `/api/hrms/contract-type/update-duration/${contractTypeId}`,
    { durations },
    { responseReturn: 'body' },
  );
}
