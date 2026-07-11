export namespace TenantManagementApi {
  export interface TenantProfile {
    expiresAt: null | string;
    id: string;
    lockedEnd: null | string;
    logoUrl: null | string;
    status: null | number;
    subscription: null | number;
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
      status: null | number;
      subscription: null | number;
      url: string;
    };
  }

  export type UpdateTenantProfilePayload = UpdateTenantProfileParams & {
    tenantId: string;
  };

  export interface TenantDetailResult {
    data: TenantItem;
    success: boolean;
  }

  export interface TenantListParams {
    current: number;
    pageSize: number;
  }

  export interface TenantListResult {
    current: number;
    data: TenantItem[];
    dataExtend: unknown;
    message: null | string;
    pageSize: number;
    success: boolean;
    total: number;
  }
}
