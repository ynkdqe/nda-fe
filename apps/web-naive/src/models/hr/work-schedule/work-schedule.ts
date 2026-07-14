import type { MResult } from '#/models/common';
import type { HrId, IdLabelOption } from "#/models/hr/common";

export namespace WorkScheduleApi {
  export interface WorkScheduleItem {
    date?: null | string;
    description?: null | string;
    employee?: null | string;
    employeeId?: HrId | null;
    employeeIds?: HrId[];
    id: HrId;
    isApplyAll?: boolean | null;
    source?: null | string;
    workshift?: null | string;
    workshiftId?: HrId | null;
  }

  export interface WorkScheduleListParams {
    endDate?: string;
    ids?: HrId[];
    page: number;
    pageSize: number;
    startDate?: string;
  }

  export type WorkScheduleListResult = MResult<WorkScheduleItem[]>;
}

export type WorkScheduleSelectOption = IdLabelOption;

export type WorkScheduleFormRecord =
  | null
  | (WorkScheduleApi.WorkScheduleItem & {
      fromDate?: null | string;
      isOverride?: boolean;
      toDate?: null | string;
    });
