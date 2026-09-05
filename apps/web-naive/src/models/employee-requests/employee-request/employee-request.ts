import type { MResult } from '#/models/common';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

/**
 * Maps NDA.Enums.EmployeeRequestStatusEnum.
 * Backend lưu giá trị số, không phải label.
 */
export enum EmployeeRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  /** Nhân viên tự rút đơn khi còn chờ duyệt. */
  Cancelled = 3,
  /** Quản lý/HR thu hồi đơn đã duyệt. */
  Revoked = 4,
}

/**
 * Maps NDA.Enums.EmployeeRequestEffectEnum — đơn LÀM GÌ khi được duyệt.
 * Quyết định backend chạy nhánh xử lý nào và form ẩn/hiện phần nào.
 */
export enum EmployeeRequestEffect {
  /** Nghỉ và trừ vào hạn mức phép. */
  LeaveWithQuota = 0,
  /** Nghỉ nhưng không trừ hạn mức (nghỉ không lương, ốm BHXH, thai sản). */
  LeaveNoQuota = 1,
  /** Vẫn đi làm, chỉ đổi ca trong một khoảng (sau thai sản, làm từ xa, công tác). */
  WorkArrangement = 2,
  /** Bổ sung hoặc sửa dữ liệu chấm công đã có. */
  TimesheetAdjustment = 3,
  /** Đăng ký làm thêm giờ. */
  Overtime = 4,
  /** Thủ tục hành chính, không đụng chấm công hay hạn mức. */
  Administrative = 5,
}

/** Maps NDA.Enums.EmployeeRequestDurationEnum — form hỏi gì về thời gian. */
export enum EmployeeRequestDuration {
  None = 0,
  SingleDate = 1,
  DateRange = 2,
  DateRangeWithPart = 3,
  DateTimeRange = 4,
}

/** Maps NDA.Enums.DayPartEnum. */
export enum DayPart {
  FullDay = 0,
  Morning = 1,
  Afternoon = 2,
  Custom = 3,
}

export const employeeRequestEffectLabels: Record<EmployeeRequestEffect, string> =
  {
    [EmployeeRequestEffect.Administrative]: 'Thủ tục hành chính',
    [EmployeeRequestEffect.LeaveNoQuota]: 'Nghỉ không trừ phép',
    [EmployeeRequestEffect.LeaveWithQuota]: 'Nghỉ trừ phép',
    [EmployeeRequestEffect.Overtime]: 'Đăng ký làm thêm giờ',
    [EmployeeRequestEffect.TimesheetAdjustment]: 'Sửa chấm công',
    [EmployeeRequestEffect.WorkArrangement]: 'Chế độ làm việc',
  };

export const employeeRequestDurationLabels: Record<
  EmployeeRequestDuration,
  string
> = {
  [EmployeeRequestDuration.DateRange]: 'Khoảng ngày',
  [EmployeeRequestDuration.DateRangeWithPart]: 'Khoảng ngày + buổi',
  [EmployeeRequestDuration.DateTimeRange]: 'Khoảng ngày + giờ',
  [EmployeeRequestDuration.None]: 'Không cần thời gian',
  [EmployeeRequestDuration.SingleDate]: 'Một ngày',
};

export const dayPartLabels: Record<DayPart, string> = {
  [DayPart.Afternoon]: 'Buổi chiều',
  [DayPart.Custom]: 'Theo giờ',
  [DayPart.FullDay]: 'Cả ngày',
  [DayPart.Morning]: 'Buổi sáng',
};

export namespace EmployeeRequestApi {
  // Maps EmployeeRequestPeriodDto.
  export interface Period {
    dayPart: DayPart;
    employeeRequestId: number;
    fromDate: string;
    /** Chỉ có giá trị khi dayPart = Custom. */
    fromTime?: null | string;
    id: number;
    toDate: string;
    toTime?: null | string;
  }

  // Maps EmployeeRequestDocumentDto.
  export interface Document {
    creationTime: string;
    documentType: string;
    documentUrl: string;
    employeeRequestId: number;
    id: number;
  }

  // Maps EmployeeRequestPeriodCreateDto.
  export interface PeriodInput {
    dayPart: DayPart;
    fromDate: string;
    /** Chỉ gửi khi dayPart = Custom. */
    fromTime?: null | string;
    toDate: string;
    toTime?: null | string;
  }

  // Maps EmployeeDto nested trong EmployeeRequestDto.
  export interface EmployeeRef {
    employeeCode?: null | string;
    id: number | string;
    name?: null | string;
  }

  // Maps EmployeeRequestDto.
  export interface Item {
    approveAt?: null | string;
    approveBy?: null | string;
    creationTime: string;
    creatorName?: null | string;
    description?: null | string;
    documents?: Document[] | null;
    employee?: EmployeeRef | null;
    employeeId: number;
    employeeRequestReason?: EmployeeRequestReasonApi.Item | null;
    employeeRequestReasonId: number;
    employeeRequestType?: EmployeeRequestTypeApi.Item | null;
    employeeRequestTypeId: number;
    id: number;
    isDeleted: boolean;
    modificationTime?: null | string;
    periods?: null | Period[];
    rejectAt?: null | string;
    rejectBy?: null | string;
    rejectReason?: null | string;
    status: EmployeeRequestStatus;
    tenantId?: null | string;
  }

  /**
   * Maps BaseFilterDto. Backend chỉ nhận status/type dạng string và tự parse.
   */
  export interface ListParams {
    current: number;
    endDate?: string;
    keyword?: string;
    pageSize: number;
    startDate?: string;
    status?: string;
    type?: string;
  }

  /**
   * Maps EmployeeRequestCreateDto. Không có employeeId: backend luôn gắn đơn cho
   * nhân viên ứng với tài khoản đang đăng nhập.
   */
  export interface CreateInput {
    description: string;
    employeeRequestReasonId: number;
    periods: PeriodInput[];
  }

  /**
   * Maps EmployeeRequestUpdateDto. Backend cố ý KHÔNG nhận status/approveBy/rejectBy ở đây
   * (duyệt/từ chối có endpoint và permission riêng), nên payload update không được gửi các field đó.
   */
  export interface UpdateInput {
    description: string;
    employeeRequestReasonId: number;
    id: number;
    periods: PeriodInput[];
  }

  // Maps EmployeeRequestRejectDto.
  export interface RejectInput {
    reason?: null | string;
  }

  // Maps EmployeeRequestQuotaDto.
  export interface Quota {
    /** Điều chỉnh thủ công của HR, có thể âm. */
    adjustmentDays: number;
    /** Hạn mức cơ bản theo chính sách, đã chia tỷ lệ nếu vào làm giữa năm. */
    baseDays: number;
    /** Phép tồn chuyển từ năm trước. */
    carriedOverDays: number;
    /** Tổng hạn mức khả dụng, đã cộng đủ các nguồn còn lại. */
    maxTime: number;
    remaining: number;
    /** Ngày cộng thêm theo thâm niên. */
    seniorityDays: number;
    unit?: null | string;
    usedTime: number;
    year: number;
  }

  /** Maps EmployeeRequestBulkResultDto trả về từ approve-many. */
  export interface BulkResult {
    approvedIds: number[];
    failed: Array<{ id: number; reason: string }>;
  }

  export interface QuotaParams {
    /** Bỏ trống để hỏi hạn mức của chính người đang đăng nhập. */
    employeeId?: number;
    employeeRequestReasonId: number;
    year?: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<Item>;
  export type QuotaResult = MResult<Quota>;
  export type BulkResultResponse = MResult<BulkResult>;
  /** Options cho màn tạo đơn, trả về dưới dạng danh sách chính sách còn hiệu lực. */
  export type OptionsResult = MResult<EmployeeRequestPolicyApi.Item[]>;
}

export const employeeRequestStatusLabels: Record<
  EmployeeRequestStatus,
  string
> = {
  [EmployeeRequestStatus.Approved]: 'Đã duyệt',
  [EmployeeRequestStatus.Cancelled]: 'Đã hủy',
  [EmployeeRequestStatus.Pending]: 'Chờ duyệt',
  [EmployeeRequestStatus.Rejected]: 'Từ chối',
  [EmployeeRequestStatus.Revoked]: 'Đã thu hồi',
};

export const employeeRequestStatusOptions = [
  { label: 'Chờ duyệt', value: EmployeeRequestStatus.Pending },
  { label: 'Đã duyệt', value: EmployeeRequestStatus.Approved },
  { label: 'Từ chối', value: EmployeeRequestStatus.Rejected },
  { label: 'Đã hủy', value: EmployeeRequestStatus.Cancelled },
  { label: 'Đã thu hồi', value: EmployeeRequestStatus.Revoked },
] as const;
