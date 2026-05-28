import type { TimesheetApi } from "#/models/hr/timesheet";

import { requestClient } from "#/api/request";

export async function getTimesheetListApi(params?: TimesheetApi.TimesheetListParams) {
  return requestClient.get<TimesheetApi.TimesheetListResult>("/api/timesheets", {
    params,
    responseReturn: "body",
  });
}
