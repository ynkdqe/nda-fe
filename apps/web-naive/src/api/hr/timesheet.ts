import { requestClient } from '#/api/request';

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

export async function getTimesheetListApi(
  params?: TimesheetApi.TimesheetListParams,
) {
  return requestClient.get<TimesheetApi.TimesheetListResult>(
    '/api/timesheets',
    {
      params,
      responseReturn: 'body',
    },
  );
}
