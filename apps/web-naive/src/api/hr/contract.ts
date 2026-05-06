import type { ContractApi } from "#/models/hr/contract";

import { requestClient } from "#/api/request";

export async function getContractListApi(params: ContractApi.ContractListParams) {
  return requestClient.get<ContractApi.ContractListResult>("/api/hrms/contract", {
    params,
    responseReturn: "body",
  });
}

export async function createContractApi(data: Record<string, any>) {
  return requestClient.post("/api/hrms/contract", data, {
    responseReturn: "body",
  });
}

export async function updateContractApi(id: number | string, data: Record<string, any>) {
  return requestClient.put(`/api/hrms/contract/${id}`, data, {
    responseReturn: "body",
  });
}

export async function deleteContractApi(id: number | string) {
  return requestClient.delete(`/api/hrms/contract/${id}`, {
    responseReturn: "body",
  });
}

export async function getContractStatusOptionsApi() {
  return requestClient.get<ContractApi.ContractOptionResult>("/api/hrms/contract/status", {
    responseReturn: "body",
  });
}

export async function getContractTypeOptionsApi() {
  return requestClient.get<ContractApi.ContractOptionResult>("/api/hrms/contract/type", {
    responseReturn: "body",
  });
}
