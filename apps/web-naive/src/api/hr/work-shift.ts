import type { WorkShiftApi } from "#/models/hr/workshift";

import { requestClient } from "#/api/request";

export async function getWorkShiftListApi(params: WorkShiftApi.WorkShiftListParams) {
  return requestClient.get<WorkShiftApi.WorkShiftListResult>("/api/hrms/workshifts", {
    params,
    responseReturn: "body",
  });
}

export async function getWorkShiftByIdApi(id: number | string) {
  return requestClient.get<WorkShiftApi.WorkShiftDetailResult>(`/api/hrms/workshifts/${id}`, {
    responseReturn: "body",
  });
}

export async function createWorkShiftApi(data: Record<string, any>) {
  return requestClient.post("/api/hrms/workshifts", data, {
    responseReturn: "body",
  });
}

export async function updateWorkShiftApi(id: number | string, data: Record<string, any>) {
  return requestClient.put(`/api/hrms/workshifts/${id}`, data, {
    responseReturn: "body",
  });
}

export async function deleteWorkShiftApi(id: number | string) {
  return requestClient.delete(`/api/hrms/workshifts/${id}`, {
    responseReturn: "body",
  });
}
