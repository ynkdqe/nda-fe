import type { MResult } from '#/models/common';

export namespace EmployeeRequestPolicyApi {
  export interface Item {
    employeeRequestReasonId: number;
    employeeRequestTypeId: number;
    /** Ngày bắt đầu hiệu lực, dạng `yyyy-MM-dd`. Null nghĩa là không giới hạn đầu kỳ. */
    fromDate?: null | string;
    id: number;
    isDeleted: boolean;
    maxTime: number;
    paid: boolean;
    /** Ngày kết thúc hiệu lực, dạng `yyyy-MM-dd`. Null nghĩa là không giới hạn cuối kỳ. */
    toDate?: null | string;
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
    fromDate?: null | string;
    maxTime: number;
    paid: boolean;
    toDate?: null | string;
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
