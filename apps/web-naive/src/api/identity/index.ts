import { requestClient } from '#/api/request';

export namespace IdentityUserApi {
  export interface UserItem {
    accessFailedCount?: number;
    concurrencyStamp?: null | string;
    creationTime?: null | string;
    email?: null | string;
    id: number | string;
    isActive?: boolean;
    lastModificationTime?: null | string;
    lockoutEnabled?: boolean;
    lockoutEnd?: null | string;
    name?: null | string;
    organizationUnitIds?: string[];
    phoneNumber?: null | string;
    roleNames?: string[];
    surname?: null | string;
    userName?: null | string;
  }

  export interface UserDetailItem {
    concurrencyStamp?: null | string;
    email?: null | string;
    id: number | string;
    isActive?: boolean;
    lockoutEnabled?: boolean;
    name?: null | string;
    organizationUnitIds?: string[];
    phoneNumber?: null | string;
    roles?: string[];
    surname?: null | string;
    userName?: null | string;
  }

  export interface UserDetailResult {
    data?: null | UserDetailItem;
    message?: null | string;
    success?: boolean;
  }

  export interface UpdateUserPayload {
    concurrencyStamp: string;
    email: string;
    isActive: boolean;
    lockoutEnabled: boolean;
    name: string;
    organizationUnitIds: string[];
    password: string;
    phoneNumber: string;
    roleNames: string[];
    surname: string;
    userName: string;
  }

  export interface UserListParams {
    filter?: string;
    maxResultCount: number;
    skipCount: number;
  }

  export interface UserListResult {
    items: UserItem[];
    totalCount?: number;
  }

  export interface SetPasswordPayload {
    password: string;
    userName: string;
  }

  export interface SetPasswordResult {
    data?: UserItem;
    message?: null | string;
    success?: boolean;
  }
}

export async function getIdentityUsers(params: IdentityUserApi.UserListParams) {
  return requestClient.get<IdentityUserApi.UserListResult>('/api/identity/users', {
    params,
    responseReturn: 'body',
  });
}

export async function getIdentityUserDetail(id: number | string) {
  return requestClient.get<IdentityUserApi.UserDetailResult>(
    `/api/identity/users/detail/${id}`,
    {
      responseReturn: 'body',
    },
  );
}

export async function updateIdentityUser(
  id: number | string,
  data: IdentityUserApi.UpdateUserPayload,
) {
  return requestClient.put<IdentityUserApi.UserItem>(
    `/api/identity/users/update/${id}`,
    data,
    {
      responseReturn: 'body',
    },
  );
}

export async function setIdentityUserPassword(data: IdentityUserApi.SetPasswordPayload) {
  return requestClient.post<IdentityUserApi.SetPasswordResult>(
    '/api/identity/users/set-password',
    data,
    { responseReturn: 'body' },
  );
}
