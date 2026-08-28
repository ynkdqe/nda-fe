import type { MResult } from '#/models/common';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

/**
 * Maps NDA.Enums.EmployeeRequestStatusEnum.
 * Backend lưu giá trị số, không phải label.
 */
export enum EmployeeRequestStatus {
  Approved = 1,
  Cancelled = 3,
  Pending = 0,
  Rejected = 2,
}

export namespace EmployeeRequestApi {
  // Maps EmployeeRequestPeriodDto.
  export interface Period {
    employeeRequestId: number;
    fromDate: string;
    fromTime: string;
    id: number;
    toDate: string;
    toTime: string;
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
    fromDate: string;
    fromTime: string;
    toDate: string;
    toTime: string;
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

  // Maps EmployeeRequestCreateDto.
  export interface CreateInput {
    description: string;
    employeeId: number;
    employeeRequestReasonId: number;
    periods: PeriodInput[];
  }

  // Maps EmployeeRequestRejectDto.
  export interface RejectInput {
    reason?: null | string;
  }

  // Maps EmployeeRequestQuotaDto.
  export interface Quota {
    maxTime: number;
    remaining: number;
    unit?: null | string;
    usedTime: number;
    year: number;
  }

  export interface QuotaParams {
    employeeId: number;
    employeeRequestReasonId: number;
    year?: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<Item>;
  export type QuotaResult = MResult<Quota>;
}

export const employeeRequestStatusLabels: Record<
  EmployeeRequestStatus,
  string
> = {
  [EmployeeRequestStatus.Approved]: 'Đã duyệt',
  [EmployeeRequestStatus.Cancelled]: 'Đã hủy',
  [EmployeeRequestStatus.Pending]: 'Chờ duyệt',
  [EmployeeRequestStatus.Rejected]: 'Từ chối',
};

export const employeeRequestStatusOptions = [
  { label: 'Chờ duyệt', value: EmployeeRequestStatus.Pending },
  { label: 'Đã duyệt', value: EmployeeRequestStatus.Approved },
  { label: 'Từ chối', value: EmployeeRequestStatus.Rejected },
  { label: 'Đã hủy', value: EmployeeRequestStatus.Cancelled },
] as const;
