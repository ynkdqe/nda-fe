import type { MResult } from '#/models/common';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

export namespace EmployeeRequestReasonApi {
  export interface Item {
    description?: null | string;
    /** Thứ tự hiển thị, tương ứng cột Display ở backend. */
    display: number;
    employeeRequestType?: EmployeeRequestTypeApi.Item | null;
    employeeRequestTypeId: number;
    id: number;
    isActive: boolean;
    isDeleted: boolean;
    name: string;
  }

  export interface ListParams {
    current: number;
    employeeRequestTypeId?: number;
    isActive?: boolean;
    keyword?: string;
    pageSize: number;
  }

  export interface CreateInput {
    description?: null | string;
    display: number;
    employeeRequestTypeId: number;
    isActive: boolean;
    name: string;
  }

  export interface UpdateInput extends CreateInput {
    id: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<unknown>;
}
