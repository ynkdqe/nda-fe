import type { MResult } from '#/models/common';

export enum TenantStatus {
  Inactive = 0,
  Active = 1,
  Suspended = 2,
  Expired = 3,
  Locked = 4,
}

export enum TenantSubscription {
  Trial = 0,
  Basic = 1,
  Professional = 2,
  Enterprise = 3,
}

export namespace TenantManagementApi {
  export interface TenantProfile {
    expiresAt: null | string;
    id: string;
    lockedEnd: null | string;
    logoUrl: null | string;
    status: null | TenantStatus;
    subscription: null | TenantSubscription;
    tenantId: string;
    url: null | string;
  }

  export interface TenantItem {
    concurrencyStamp: null | string;
    creationTime: null | string;
    creatorId: null | string;
    extraProperties: Record<string, unknown>;
    id: string;
    modificationTime: null | string;
    modifierId: null | string;
    name: string;
    profile: null | TenantProfile;
  }

  export interface UpdateTenantProfileParams {
    name: string;
    profile: {
      expiresAt: null | string;
      lockedEnd: null | string;
      logoUrl: string;
      status: null | TenantStatus;
      subscription: null | TenantSubscription;
      url: string;
    };
  }

  export type UpdateTenantProfilePayload = UpdateTenantProfileParams & {
    tenantId: string;
  };

  export type TenantDetailResult = MResult<TenantItem>;

  export interface TenantListParams {
    current: number;
    pageSize: number;
  }

  export type TenantListResult = MResult<TenantItem[]>;
}
