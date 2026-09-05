import type { MResult } from '#/models/common';
import type {
  EmployeeRequestDuration,
  EmployeeRequestEffect,
} from '#/models/employee-requests/employee-request';

export namespace EmployeeRequestPolicyApi {
  export interface Item {
    id: number;
    employeeRequestTypeId: number;
    employeeRequestReasonId: number;
    paid: boolean;
    /** Đơn làm gì khi được duyệt. */
    effectKind: EmployeeRequestEffect;
    /** Form tạo đơn hỏi gì về thời gian. */
    durationInput: EmployeeRequestDuration;

    /** null = không giới hạn hạn mức, khác hẳn với 0. */
    maxTime?: null | number;
    unit?: null | string;
    maxCarryOverDays: number;
    seniorityBonusEnabled: boolean;
    prorateOnJoin: boolean;

    /** Ca làm việc thay thế, chỉ dùng cho effectKind = WorkArrangement. */
    overrideWorkshiftId?: null | number;
    /** Độ dài chế độ tính bằng tháng; null = tự nhập ngày kết thúc. */
    durationMonths?: null | number;

    overtimeRate?: null | number;
    maxOvertimeHoursPerMonth?: null | number;
    maxOvertimeHoursPerYear?: null | number;

    minNoticeDays: number;
    maxBackdateDays: number;
    requireDocument: boolean;
    maxDaysPerRequest?: null | number;

    minSeniorityMonths?: null | number;
    /** Maps GenderEnum: 0 nam, 1 nữ, 2 khác. null = mọi giới. */
    requiredGender?: null | number;

    fromDate?: null | string;
    toDate?: null | string;
    isDeleted: boolean;

    /** Các field phẳng dưới đây chỉ có khi API list nạp kèm loại đơn và lý do. */
    employeeRequestTypeName?: null | string;
    employeeRequestTypeDisplayOrder?: null | number;
    employeeRequestReasonName?: null | string;
    employeeRequestReasonDisplay?: null | number;
    employeeRequestReasonIsActive?: boolean | null;
    overrideWorkshiftName?: null | string;
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
    employeeRequestTypeId: number;
    employeeRequestReasonId: number;
    paid: boolean;
    /** Đơn làm gì khi được duyệt. */
    effectKind: EmployeeRequestEffect;
    /** Form tạo đơn hỏi gì về thời gian. */
    durationInput: EmployeeRequestDuration;

    /** null = không giới hạn hạn mức, khác hẳn với 0. */
    maxTime?: null | number;
    unit?: null | string;
    maxCarryOverDays: number;
    seniorityBonusEnabled: boolean;
    prorateOnJoin: boolean;

    /** Ca làm việc thay thế, chỉ dùng cho effectKind = WorkArrangement. */
    overrideWorkshiftId?: null | number;
    /** Độ dài chế độ tính bằng tháng; null = tự nhập ngày kết thúc. */
    durationMonths?: null | number;

    overtimeRate?: null | number;
    maxOvertimeHoursPerMonth?: null | number;
    maxOvertimeHoursPerYear?: null | number;

    minNoticeDays: number;
    maxBackdateDays: number;
    requireDocument: boolean;
    maxDaysPerRequest?: null | number;

    minSeniorityMonths?: null | number;
    /** Maps GenderEnum: 0 nam, 1 nữ, 2 khác. null = mọi giới. */
    requiredGender?: null | number;

    fromDate?: null | string;
    toDate?: null | string;
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
