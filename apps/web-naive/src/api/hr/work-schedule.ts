import { requestClient } from '#/api/request';

export namespace WorkScheduleApi {
  export interface WorkScheduleItem {
    date?: null | string;
    description?: null | string;
    employee?: null | string;
    employeeId?: null | number | string;
    employeeIds?: Array<number | string>;
    id: number | string;
    isApplyAll?: boolean | null;
    source?: null | string;
    workshift?: null | string;
    workshiftId?: null | number | string;
  }

  export interface WorkScheduleListParams {
    date?: string;
    datePicker?: string;
    employeeIds?: Array<number | string>;
    page: number;
    pageSize: number;
  }

  export interface WorkScheduleListResult {
    current?: number;
    data?: WorkScheduleItem[];
    dataExtend?: unknown;
    items?: WorkScheduleItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }
}

export async function getWorkScheduleListApi(
  params: WorkScheduleApi.WorkScheduleListParams,
) {
  return requestClient.get<WorkScheduleApi.WorkScheduleListResult>(
    '/api/hrms/workshift-schedule',
    {
      params,
      responseReturn: 'body',
    },
  );
}

export async function createWorkScheduleApi(data: Record<string, any>) {
  return requestClient.post('/api/hrms/workshift-schedule', data, {
    responseReturn: 'body',
  });
}

export async function updateWorkScheduleApi(
  id: number | string,
  data: Record<string, any>,
) {
  return requestClient.put(`/api/hrms/workshift-schedule/${id}`, data, {
    responseReturn: 'body',
  });
}

export async function deleteWorkScheduleApi(id: number | string) {
  return requestClient.delete(`/api/hrms/workshift-schedule/${id}`, {
    responseReturn: 'body',
  });
}
