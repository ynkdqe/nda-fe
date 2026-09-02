import type { MResult } from '#/models/common';

export namespace EmployeeRequestQuotaApi {
  /**
   * Quyền lợi phép của một nhân viên trong một năm, tách theo từng nguồn
   * để HR nhìn được vì sao tổng lại khác con số chuẩn của chính sách.
   */
  export interface Item {
    /** Điều chỉnh thủ công của HR, có thể âm. */
    adjustmentDays: number;
    adjustmentNote?: null | string;
    /** Hạn mức chuẩn theo chính sách, đã chia tỷ lệ nếu vào làm giữa năm. */
    baseDays: number;
    /** Phép tồn năm trước chuyển sang. */
    carriedOverDays: number;
    employeeCode?: null | string;
    employeeId: number;
    employeeName?: null | string;
    employeeRequestPolicyId: number;
    employeeRequestReasonName?: null | string;
    id: number;
    remaining: number;
    /** Phép cộng thêm theo thâm niên. */
    seniorityDays: number;
    totalDays: number;
    unit?: null | string;
    usedTime: number;
    year: number;
  }

  export interface ListParams {
    current: number;
    employeeId?: number;
    employeeRequestPolicyId?: number;
    keyword?: string;
    pageSize: number;
    year?: number;
  }

  /** Không cho sửa usedTime vì con số đó phải luôn khớp với các đơn đã ghi nhận. */
  export interface UpdateInput {
    adjustmentDays: number;
    adjustmentNote?: null | string;
    baseDays: number;
    seniorityDays: number;
  }

  export interface GenerateInput {
    /** Bỏ trống để cấp cho toàn bộ nhân viên đang làm việc. */
    employeeId?: null | number;
    employeeRequestPolicyId: number;
    year: number;
  }

  export type ListResult = MResult<Item[]>;
  export type MutationResult = MResult<unknown>;
}
