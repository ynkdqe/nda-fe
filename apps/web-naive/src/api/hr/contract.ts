import { requestClient } from '#/api/request';

export namespace ContractApi {
  export interface ContractEmployee {
    employeeCode?: null | string;
    id?: null | number | string;
    name?: null | string;
    userName?: null | string;
  }

  export interface ContractItem {
    contractCode?: null | string;
    contractName?: null | string;
    contractType?: null | number | string;
    creationTime?: null | string;
    effectiveDate?: null | string;
    employee?: ContractEmployee | null;
    employeeCode?: null | string;
    employeeId?: null | number | string;
    employeeName?: null | string;
    expiryDate?: null | string;
    id: number | string;
    modificationTime?: null | string;
    name?: null | string;
    salaryGross?: null | number | string;
    status?: null | number | string;
    totalCost?: null | number | string;
    totalSalary?: null | number | string;
  }

  export interface ContractListParams {
    contractType?: null | number | string;
    current: number;
    effectiveEnd?: string;
    effectiveStart?: string;
    isActive?: null | number | string;
    keyword?: string;
    pageSize: number;
    status?: null | number | string;
  }

  export interface ContractListResult {
    current?: number;
    data?: ContractItem[];
    dataExtend?: unknown;
    items?: ContractItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }

  export interface ContractOptionItem {
    id: number | string;
    name?: null | string;
  }

  export type ContractOptionResult =
    | ContractOptionItem[]
    | {
        data?: ContractOptionItem[];
        items?: ContractOptionItem[];
      };
}

export async function getContractListApi(
  params: ContractApi.ContractListParams,
) {
  return requestClient.get<ContractApi.ContractListResult>(
    '/api/hrms/contract',
    {
      params,
      responseReturn: 'body',
    },
  );
}

export async function createContractApi(data: Record<string, any>) {
  return requestClient.post('/api/hrms/contract', data, {
    responseReturn: 'body',
  });
}

export async function updateContractApi(
  id: number | string,
  data: Record<string, any>,
) {
  return requestClient.put(`/api/hrms/contract/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteContractApi(id: number | string) {
  return requestClient.delete(`/api/hrms/contract/${id}`, {
    responseReturn: 'body',
  });
}

export async function getContractStatusOptionsApi() {
  return requestClient.get<ContractApi.ContractOptionResult>(
    '/api/hrms/contract/status',
    {
      responseReturn: 'body',
    },
  );
}

export async function getContractTypeOptionsApi() {
  return requestClient.get<ContractApi.ContractOptionResult>(
    '/api/hrms/contract/type',
    {
      responseReturn: 'body',
    },
  );
}
