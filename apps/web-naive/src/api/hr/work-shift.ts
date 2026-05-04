import { requestClient } from '#/api/request';

export namespace WorkShiftApi {
  export interface WorkShiftItem {
    code?: null | string;
    creationTime?: null | string;
    fromTime?: null | string;
    hasBreak?: boolean | null;
    id: number | string;
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

  export interface WorkShiftListResult {
    current?: number;
    data?: WorkShiftItem[];
    dataExtend?: unknown;
    items?: WorkShiftItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }
}

export async function getWorkShiftListApi(
  params: WorkShiftApi.WorkShiftListParams,
) {
  return requestClient.get<WorkShiftApi.WorkShiftListResult>(
    '/api/hrms/workshifts',
    {
      params,
      responseReturn: 'body',
    },
  );
}

export async function getWorkShiftByIdApi(id: number | string) {
  return requestClient.get<
    | WorkShiftApi.WorkShiftItem
    | {
        data?: WorkShiftApi.WorkShiftItem;
      }
  >(`/api/hrms/workshifts/${id}`, {
    responseReturn: 'body',
  });
}

export async function createWorkShiftApi(data: Record<string, any>) {
  return requestClient.post('/api/hrms/workshifts', data, {
    responseReturn: 'body',
  });
}

export async function updateWorkShiftApi(
  id: number | string,
  data: Record<string, any>,
) {
  return requestClient.put(`/api/hrms/workshifts/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteWorkShiftApi(id: number | string) {
  return requestClient.delete(`/api/hrms/workshifts/${id}`, {
    responseReturn: 'body',
  });
}
