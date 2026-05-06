import { requestClient } from '#/api/request';

export namespace EmployeeApi {
  export interface Bank {
    bin?: null | string;
    code?: null | string;
    id: number | string;
    isTransfer?: boolean;
    logo?: null | string;
    lookupSupported?: null | number;
    name?: null | string;
    short_name?: null | string;
    shortName?: null | string;
    support?: null | number;
    swift_code?: null | string;
    transferSupported?: null | number;
  }

  export interface EmployeeBankItem {
    accountName?: null | string;
    accountNo?: null | string;
    bankId?: null | number | string;
  }

  export interface EmployeeItem {
    address?: null | string;
    avatar?: null | string;
    banks?: EmployeeBankItem[] | null | string;
    birthDate?: null | string;
    concurrencyStamp?: null | string;
    creationTime?: null | string;
    department?: null | string;
    email?: null | string;
    employeeCode?: null | string;
    enrollDate?: null | string;
    gender?: null | number;
    id: number | string;
    identification?: null | string;
    modificationTime?: null | string;
    maritalStatus?: null | number | string;
    name?: null | string;
    national?: null | string;
    phone?: null | string;
    position?: null | string;
    resignationDate?: null | string;
    role?: null | Record<string, unknown> | string;
    roles?: Array<Record<string, unknown> | string>;
    status?: null | string;
    taxCode?: null | string;
    user?: null | Record<string, unknown>;
    userId?: null | string;
    userName?: null | string;
    workshiftId?: null | number | string;
  }

  export interface EmployeeMutationPayload {
    address?: null | string;
    banks?: EmployeeBankItem[] | null;
    birthDate?: null | string;
    concurrencyStamp?: null | string;
    department?: null | string;
    email?: null | string;
    employeeCode?: null | string;
    enrollDate?: null | string;
    gender?: null | number;
    identification?: null | string;
    maritalStatus?: null | number;
    name: string;
    national?: null | string;
    phone: string;
    position?: null | string;
    resignationDate?: null | string;
    status?: null | string;
    taxCode?: null | string;
    userId?: null | string;
    userName?: null | string;
    workshiftId?: null | number | string;
  }

  export interface EmployeeOptionItem {
    code?: null | string;
    displayName?: null | string;
    id?: null | number | string;
    name?: null | string;
    shortName?: null | string;
    value?: null | number | string;
  }

  export type EmployeeOptionResult =
    | EmployeeOptionItem[]
    | {
        data?: EmployeeOptionItem[];
        items?: EmployeeOptionItem[];
      };

  export interface EmployeeListParams {
    current: number;
    email?: string;
    employeeCode?: string;
    name?: string;
    pageSize: number;
    phone?: string;
    status?: string;
    userName?: string;
  }

  export interface EmployeeListResult {
    current: number;
    data: EmployeeItem[];
    dataExtend?: unknown;
    message?: null | string;
    pageSize: number;
    success: boolean;
    total: number;
  }

  export type EmployeeDetailResult =
    | EmployeeItem
    | {
        data?: EmployeeItem;
      };

  export interface BankListResult {
    current: number;
    data: Bank[];
    pageSize: number;
    success: boolean;
    total: number;
  }
}

let bankListRequest: null | Promise<EmployeeApi.BankListResult> = null;

export async function getEmployeeListApi(
  params: EmployeeApi.EmployeeListParams,
) {
  return requestClient.get<EmployeeApi.EmployeeListResult>(
    '/api/hrms/employee',
    {
      params,
      responseReturn: 'body',
    },
  );
}

export async function getEmployeeByIdApi(id: number | string) {
  return requestClient.get<EmployeeApi.EmployeeDetailResult>(
    `/api/hrms/employee/${id}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function createEmployeeApi(
  data: EmployeeApi.EmployeeMutationPayload,
) {
  return requestClient.post('/api/hrms/employee', data, {
    responseReturn: 'body',
  });
}

export async function updateEmployeeApi(
  id: number | string,
  data: EmployeeApi.EmployeeMutationPayload,
) {
  return requestClient.put(`/api/hrms/employee/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function getEmployeeDepartmentOptionsApi() {
  return requestClient.get<EmployeeApi.EmployeeOptionResult>(
    '/api/identity/organization-unit',
    {
      responseReturn: 'body',
    },
  );
}

export async function getEmployeePositionOptionsApi() {
  return requestClient.get<EmployeeApi.EmployeeOptionResult>(
    '/api/identity/roles',
    {
      params: {
        skipCount: 0,
        maxResultCount: 100,
      },
      responseReturn: 'body',
    },
  );
}

export async function getEmployeeBankOptionsApi() {
  if (!bankListRequest) {
    bankListRequest = requestClient
      .get<EmployeeApi.BankListResult>('/api/master/bank', {
        params: {
          current: 1,
          pageSize: 100,
        },
        responseReturn: 'body',
      })
      .catch((error: unknown) => {
        bankListRequest = null;
        throw error;
      });
  }

  return bankListRequest;
}
