import { requestClient } from "#/api/request";

export namespace ContractTypeApi {
  export interface DurationItem {
    description?: null | string;
    duration?: null | number;
    id?: null | number | string;
    name?: null | string;
    unit?: null | string;
  }

  export interface ContractTypeItem {
    businessHealthInsurancePercent?: null | number | string;
    businessOccAccInsurancePercent?: null | number | string;
    businessSocialInsurancePercent?: null | number | string;
    businessUnemploymentInsurancePercent?: null | number | string;
    code?: null | string;
    creationTime?: null | string;
    durations?: DurationItem[];
    employeeHealthInsurancePercent?: null | number | string;
    employeeMinTaxSalary?: null | number | string;
    employeeSocialInsurancePercent?: null | number | string;
    employeeUnionPercent?: null | number | string;
    employeeUnemployeeInsurancePercent?: null | number | string;

    hasSocialInsurance?: boolean | null;
    id: number | string;
    isTaxFixed?: boolean | null;
    minInsuranceSalary?: null | number | string;
    modificationTime?: null | string;
    name?: null | string;
    taxPercent?: null | number | string;
  }

  export interface ContractTypeListParams {
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export interface ContractTypeListResult {
    current?: number;
    data?: ContractTypeItem[];
    dataExtend?: unknown;
    items?: ContractTypeItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }
}

export async function getContractTypeListApi(params: ContractTypeApi.ContractTypeListParams) {
  return requestClient.get<ContractTypeApi.ContractTypeListResult>("/api/hrms/contract-type", {
    params,
    responseReturn: "body",
  });
}

export async function getContractTypeByIdApi(id: number | string) {
  return requestClient.get<ContractTypeApi.ContractTypeItem>(`/api/hrms/contract-type/${id}`, {
    responseReturn: "body",
  });
}

export async function createContractTypeApi(data: Record<string, any>) {
  return requestClient.post("/api/hrms/contract-type", data, {
    responseReturn: "body",
  });
}

export async function updateContractTypeApi(id: number | string, data: Record<string, any>) {
  return requestClient.put(`/api/hrms/contract-type/${id}`, data, {
    responseReturn: "body",
  });
}

export async function deleteContractTypeApi(id: number | string) {
  return requestClient.delete(`/api/hrms/contract-type/${id}`, {
    responseReturn: "body",
  });
}

export async function updateContractTypeDurationsApi(
  contractTypeId: number | string,
  durations: ContractTypeApi.DurationItem[],
) {
  return requestClient.put(
    `/api/hrms/contract-type/update-duration/${contractTypeId}`,
    { durations },
    { responseReturn: "body" },
  );
}
