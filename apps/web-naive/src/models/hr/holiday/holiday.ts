import type { MResult } from '#/models/common';

export namespace HolidayApi {
  export interface HolidayItem {
    creationTime?: null | string;
    date?: null | string;
    description?: null | string;
    holidayType?: null | number | string;
    id: number | string;
    isPaid?: boolean | null;
    name?: null | string;
    type?: null | number | string;
  }

  export interface HolidayListParams {
    current?: number;
    endDate?: string;
    keyword?: string;
    pageSize?: number;
    startDate?: string;
  }

  export type HolidayListResult = MResult<HolidayItem[]>;

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

export type HolidayTypeOption = { label: string; value: number | string };
export type WeekendQuickMode = 'none' | 'saturday' | 'sunday' | 'weekend';

export interface HolidayFormState {
  dates: string[];
  description: string;
  holidayType: null | number | string;
  isPaid: boolean;
  name: string;
  saturdayOnly: boolean;
  sundayOnly: boolean;
  weekendFull: boolean;
}
