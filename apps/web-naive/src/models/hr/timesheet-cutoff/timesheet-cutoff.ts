import type { MResult } from '#/models/common';

export namespace TimesheetCutoffApi {
  // Maps TimesheetCutoffDto.
  export interface Item {
    cutoffDate: string;
    id: number;
    isDeleted: boolean;
    month: number;
    note?: null | string;
    year: number;
  }

  export interface ListParams {
    current: number;
    keyword?: string;
    pageSize: number;
  }

  // Maps TimesheetCutoffCreateDto.
  export interface CreateInput {
    cutoffDate: string;
    month: number;
    note?: null | string;
    year: number;
  }

  // Maps TimesheetCutoffUpdateDto.
  export interface UpdateInput extends CreateInput {
    id: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<Item>;
}
