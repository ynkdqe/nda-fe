import type { HolidayApi } from "#/models/hr/holiday";

import { requestClient } from "#/api/request";

export async function getHolidayListApi(params: HolidayApi.HolidayListParams) {
  return requestClient.get<HolidayApi.HolidayListResult>("/api/hrms/holiday", {
    params,
    responseReturn: "body",
  });
}

export async function createHolidayApi(data: Record<string, any>) {
  return requestClient.post("/api/hrms/holiday", data, {
    responseReturn: "body",
  });
}

export async function deleteHolidayApi(id: number | string) {
  return requestClient.delete(`/api/hrms/holiday/${id}`, {
    responseReturn: "body",
  });
}

export async function getHolidayTypeOptionsApi() {
  return requestClient.get<HolidayApi.HolidayTypeResult>("/api/hrms/holiday/holiday-type", {
    responseReturn: "body",
  });
}
