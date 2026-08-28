import type { MResult } from '#/models/common';

export namespace EmployeeRequestTypeApi {
  export interface Item {
    description?: null | string;
    displayOrder: number;
    icon?: null | string;
    id: number;
    isDeleted: boolean;
    name: string;
    tenantId?: null | string;
  }

  export interface ListParams {
    current: number;
    keyword?: string;
    pageSize: number;
  }

  export interface CreateInput {
    description?: null | string;
    displayOrder: number;
    icon?: null | string;
    name: string;
  }

  export interface UpdateInput extends CreateInput {
    id: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<unknown>;
}
