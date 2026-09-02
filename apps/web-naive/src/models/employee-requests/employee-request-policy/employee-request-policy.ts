import type { MResult } from '#/models/common';

export namespace EmployeeRequestPolicyApi {
  export interface Item {
    /** Các field phẳng dưới đây chỉ có khi API list nạp kèm loại đơn và lý do. */
    employeeRequestReasonDisplay?: null | number;
    employeeRequestReasonId: number;
    employeeRequestReasonIsActive?: boolean | null;
    employeeRequestReasonName?: null | string;
    employeeRequestTypeDisplayOrder?: null | number;
    employeeRequestTypeId: number;
    employeeRequestTypeName?: null | string;
    /** Ngày bắt đầu hiệu lực, dạng `yyyy-MM-dd`. Null nghĩa là không giới hạn đầu kỳ. */
    fromDate?: null | string;
    id: number;
    isDeleted: boolean;
    /** Số ngày tồn tối đa được chuyển sang năm sau. 0 nghĩa là không cho chuyển. */
    maxCarryOverDays: number;
    maxTime: number;
    paid: boolean;
    /** Chia hạn mức theo số tháng làm việc cho người vào làm giữa năm. */
    prorateOnJoin: boolean;
    /** Cộng thêm ngày phép theo thâm niên (Điều 114 BLLĐ: +1 ngày mỗi 5 năm). */
    seniorityBonusEnabled: boolean;
    /** Ngày kết thúc hiệu lực, dạng `yyyy-MM-dd`. Null nghĩa là không giới hạn cuối kỳ. */
    toDate?: null | string;
    unit?: null | string;
  }

  export interface ListParams {
    current: number;
    employeeRequestReasonId?: number;
    employeeRequestTypeId?: number;
    /** Cùng với startDate tạo thành khoảng cần chính sách còn hiệu lực, dạng `yyyy-MM-dd`. */
    endDate?: string;
    keyword?: string;
    pageSize: number;
    startDate?: string;
  }

  export interface CreateInput {
    employeeRequestReasonId: number;
    employeeRequestTypeId: number;
    fromDate?: null | string;
    maxCarryOverDays: number;
    maxTime: number;
    paid: boolean;
    prorateOnJoin: boolean;
    seniorityBonusEnabled: boolean;
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
