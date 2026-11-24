import type { MResult } from '#/models/common';
import type { HrId } from '#/models/hr/common';

export namespace WorkShiftApi {
  export interface WorkShiftItem {
    code?: null | string;
    creationTime?: null | string;
    fromTime?: null | string;
    hasBreak?: boolean | null;
    id: HrId;
    isDefault?: boolean | null;
    modificationTime?: null | string;
    name?: null | string;
    overShift?: boolean | null;
    toTime?: null | string;
    workHours?: null | number | string;
    workPoint?: null | number | string;
  }

  export interface WorkShiftListParams {
    keyword?: string;
    page: number;
    pageSize: number;
  }

  export type WorkShiftListResult = MResult<WorkShiftItem[]>;

  export type WorkShiftDetailResult = MResult<WorkShiftItem>;

  export interface AssignmentEmployee {
    employeeCode: null | string;
    id: number;
    isAssigned: boolean;
    name: string;
  }

  export interface Assignments {
    canRemove: boolean;
    employees: AssignmentEmployee[];
  }

  export interface AssignmentUpdateInput {
    assignEmployeeIds: number[];
    removeEmployeeIds: number[];
  }

  export type AssignmentsResult = MResult<Assignments>;
  export type AssignmentUpdateResult = MResult<unknown>;
}

export interface WorkShiftFormModel {
  breakFrom: null | string;
  breakTo: null | string;
  code: string;
  flexible: boolean;
  fromTime: null | string;
  hasBreak: boolean;
  isDefault: boolean;
  maxCheckIn: null | string;
  maxCheckOut: null | string;
  minCheckIn: null | string;
  minCheckOut: null | string;
  name: string;
  nameAscii: string;
  overShift: boolean;
  toTime: null | string;
  workHours: null | number;
  workPoint: null | number;
}

export type WorkShiftRecord = Partial<WorkShiftFormModel> & Record<string, any>;
