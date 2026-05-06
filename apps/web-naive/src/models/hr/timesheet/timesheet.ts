export namespace TimesheetApi {
  export interface WorkshiftInfo {
    name?: null | string;
    nameAscii?: null | string;
    workPoint?: null | number;
  }

  export interface HolidayInfo {
    description?: null | string;
    holidayTypeName?: null | string;
    isPaid?: boolean | null;
    name?: null | string;
  }

  export interface TimesheetItem {
    actualPoint?: null | number;
    checkIn?: null | string;
    checkOut?: null | string;
    dateSheet?: null | string;
    description?: null | string;
    holiday?: HolidayInfo | null;
    isAbsent?: boolean | null;
    isLate?: boolean | null;
    isMissing?: boolean | null;
    workshift?: null | WorkshiftInfo;
  }

  export interface TimesheetDataExtend {
    actualWorkdays?: number;
    actualWorkHours?: number;
    annualLeave?: number;
    earlyLate?: number;
    missing?: number;
    overtime?: number;
    paidLeave?: number;
    unpaidLeave?: number;
    workdays?: number;
    workHours?: number;
  }

  export interface TimesheetListParams {
    month?: number;
    year?: number;
  }

  export interface TimesheetListResult {
    data?: TimesheetItem[];
    dataExtend?: TimesheetDataExtend;
    message?: null | string;
    success?: boolean;
  }
}

export type TimesheetCalendarEntryType = 'absent' | 'holiday' | 'late' | 'missing' | 'work';
export type TimesheetCalendarBadgeType =
  | 'danger'
  | 'default'
  | 'primary'
  | 'purple'
  | 'success'
  | 'warning';
export type TimesheetTrend = 'down' | 'up';

export interface TimesheetCalendarEntry {
  label?: string;
  note?: string;
  timeRange: string;
  type: TimesheetCalendarEntryType;
}

export interface TimesheetCalendarBadge {
  text: string;
  type?: TimesheetCalendarBadgeType;
}

export interface TimesheetCalendarDay {
  badges?: TimesheetCalendarBadge[];
  date: string;
  entries: TimesheetCalendarEntry[];
  highlight?: {
    type?: Extract<TimesheetCalendarBadgeType, 'danger' | 'primary' | 'success' | 'warning'>;
    value: string;
  };
}

export interface TimesheetOverviewItem {
  color?: Extract<TimesheetCalendarBadgeType, 'danger' | 'primary' | 'success' | 'warning'>;
  label: string;
  total: number;
  unit?: string;
  value: number;
}

export interface TimesheetStatisticItem {
  hint?: string;
  label: string;
  trend?: TimesheetTrend;
  value: number | string;
}
