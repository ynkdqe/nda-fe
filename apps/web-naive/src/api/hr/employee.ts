import { requestClient } from "#/api/request";

export namespace EmployeeApi {
  export interface EmployeeItem {
    address?: null | string;
    avatar?: null | string;
    birthDate?: null | string;
    concurrencyStamp?: null | string;
    creationTime?: null | string;
    department?: null | string;
    email?: null | string;
    employeeCode?: null | string;
    enrollDate?: null | string;
    gender?: null | number;
    id: number | string;
    modificationTime?: null | string;
    name?: null | string;
    phone?: null | string;
    position?: null | string;
    resignationDate?: null | string;
    status?: null | string;
    userId?: null | string;
    userName?: null | string;
  }

  export interface EmployeeMutationPayload {
    address?: null | string;
    birthDate?: null | string;
    concurrencyStamp?: null | string;
    department?: null | string;
    email?: null | string;
    employeeCode?: null | string;
    enrollDate?: null | string;
    gender?: null | number;
    name: string;
    phone: string;
    position?: null | string;
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

export async function getEmployeeListApi(params: EmployeeApi.EmployeeListParams) {
  return requestClient.get<EmployeeApi.EmployeeListResult>("/api/hrms/employee", {
    params,
    responseReturn: "body",
  });
}

export async function createEmployeeApi(data: EmployeeApi.EmployeeMutationPayload) {
  return requestClient.post("/api/hrms/employee", data, {
    responseReturn: "body",
  });
}

export async function updateEmployeeApi(
  id: number | string,
  data: EmployeeApi.EmployeeMutationPayload,
) {
  return requestClient.put(`/api/hrms/employee/${id}`, data, {
    responseReturn: "body",
  });
}
