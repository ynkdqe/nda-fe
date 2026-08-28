import type { MResult } from '#/models/common';

export namespace EmployeeRequestDocumentApi {
  // Maps EmployeeRequestDocumentDto.
  export interface Item {
    creationTime: string;
    documentType: string;
    documentUrl: string;
    employeeRequestId: number;
    id: number;
  }

  export interface ListParams {
    current: number;
    keyword?: string;
    pageSize: number;
  }

  // Maps EmployeeRequestDocumentCreateDto.
  export interface CreateInput {
    documentType: string;
    documentUrl: string;
    employeeRequestId: number;
  }

  // Maps EmployeeRequestDocumentUpdateDto.
  export interface UpdateInput extends CreateInput {
    id: number;
  }

  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Item>;
  export type MutationResult = MResult<Item>;
}
