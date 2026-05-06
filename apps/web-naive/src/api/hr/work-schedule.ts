import type { WorkScheduleApi } from "#/models/hr/work-schedule";

import { requestClient } from "#/api/request";

export async function getWorkScheduleListApi(params: WorkScheduleApi.WorkScheduleListParams) {
  return requestClient.get<WorkScheduleApi.WorkScheduleListResult>("/api/hrms/workshift-schedule", {
    params,
    responseReturn: "body",
  });
}

export async function createWorkScheduleApi(data: Record<string, any>) {
  return requestClient.post("/api/hrms/workshift-schedule", data, {
    responseReturn: "body",
  });
}

export async function updateWorkScheduleApi(id: number | string, data: Record<string, any>) {
  return requestClient.put(`/api/hrms/workshift-schedule/${id}`, data, {
    responseReturn: "body",
  });
}

export async function deleteWorkScheduleApi(id: number | string) {
  return requestClient.delete(`/api/hrms/workshift-schedule/${id}`, {
    responseReturn: "body",
  });
}
