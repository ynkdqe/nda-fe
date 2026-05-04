import { requestClient } from '#/api/request';

export namespace HolidayApi {
  export interface HolidayItem {
    creationTime?: null | string;
    date?: null | string;
    description?: null | string;
    holidayType?: null | number | string;
    id: number | string;
    name?: null | string;
    type?: null | number | string;
  }

  export interface HolidayListParams {
    endDate?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
  }

  export interface HolidayListResult {
    current?: number;
    data?: HolidayItem[];
    dataExtend?: unknown;
    items?: HolidayItem[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }

  export interface HolidayTypeItem {
    code?: null | number | string;
    id?: null | number | string;
    key?: null | number | string;
    label?: null | string;
    name?: null | string;
    title?: null | string;
    value?: null | number | string;
  }

  export type HolidayTypeResult =
    | HolidayTypeItem[]
    | {
        data?: HolidayTypeItem[];
        items?: HolidayTypeItem[];
      };
}

export async function getHolidayListApi(params: HolidayApi.HolidayListParams) {
  return requestClient.get<HolidayApi.HolidayListResult>('/api/hrms/holiday', {
    params,
    responseReturn: 'body',
  });
}

export async function createHolidayApi(data: Record<string, any>) {
  return requestClient.post('/api/hrms/holiday', data, {
    responseReturn: 'body',
  });
}

export async function deleteHolidayApi(id: number | string) {
  return requestClient.delete(`/api/hrms/holiday/${id}`, {
    responseReturn: 'body',
  });
}

export async function getHolidayTypeOptionsApi() {
  return requestClient.get<HolidayApi.HolidayTypeResult>(
    '/api/hrms/holiday/holiday-type',
    {
      responseReturn: 'body',
    },
  );
}
