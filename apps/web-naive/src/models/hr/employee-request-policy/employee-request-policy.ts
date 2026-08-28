import type { MResult } from '#/models/common';

export namespace EmployeeRequestPolicyApi {
  export interface Item {
    employeeRequestReasonId: number;
    employeeRequestTypeId: number;
    id: number;
    isDeleted: boolean;
    maxTime: number;
    paid: boolean;
    unit?: null | string;
  }

  export interface ListParams {
    current: number;
    employeeRequestReasonId?: number;
    employeeRequestTypeId?: number;
    keyword?: string;
    pageSize: number;
  }

  export interface CreateInput {
    employeeRequestReasonId: number;
    employeeRequestTypeId: number;
    maxTime: number;
    paid: boolean;
    unit?: null | string;
  }

  export interface UpdateInput extends CreateInput {
    id: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<unknown>;
}

export const employeeRequestPolicyUnits = [
  { label: 'Ngày', value: 'Day' },
  { label: 'Giờ', value: 'Hour' },
] as const;
