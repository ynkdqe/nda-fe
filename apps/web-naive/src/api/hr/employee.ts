import { requestClient } from '#/api/request';

export namespace EmployeeApi {
  export interface EmployeeItem {
    address?: null | string;
    avatar?: null | string;
    birthDate?: null | string;
    creationTime?: null | string;
    email?: null | string;
    employeeCode?: null | string;
    enrollDate?: null | string;
    id: number | string;
    modificationTime?: null | string;
    name?: null | string;
    phone?: null | string;
    resignationDate?: null | string;
    status?: null | string;
    userId?: null | string;
    userName?: null | string;
  }

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
}

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
