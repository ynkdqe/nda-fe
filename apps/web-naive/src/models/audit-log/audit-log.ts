import type { MResult } from '#/models/common';

type Id = string;
type NullableString = null | string;
type UnknownRecord = Record<string, unknown>;

export interface AuditActionDto {
  auditLogId: Id;
  executionDuration?: null | number;
  executionTime?: null | string;
  extraProperties?: UnknownRecord;
  id: Id;
  methodName?: NullableString;
  parameters?: NullableString;
  serviceName?: NullableString;
  tenantId?: NullableString;
}

export interface AuditLogDto {
  actions?: AuditActionDto[] | null;
  applicationName?: NullableString;
  browserInfo?: NullableString;
  clientId?: NullableString;
  clientIpAddress?: NullableString;
  clientName?: NullableString;
  comments?: NullableString;
  correlationId?: NullableString;
  entityChanges?: unknown;
  exceptions?: NullableString;
  executionDuration?: null | number;
  executionTime?: null | string;
  httpMethod?: NullableString;
  httpStatusCode?: null | number;
  id: Id;
  impersonatorTenantId?: NullableString;
  impersonatorTenantName?: NullableString;
  impersonatorUserId?: NullableString;
  impersonatorUserName?: NullableString;
  tenantName?: NullableString;
  url?: NullableString;
  userId?: NullableString;
  userName?: NullableString;
}

export type AuditLogListResult = MResult<AuditLogDto[]>;
