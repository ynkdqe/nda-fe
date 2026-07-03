import { requestClient } from '#/api/request';

export namespace IdentityUserApi {
  export interface UserItem {
    accessFailedCount?: number;
    creationTime?: null | string;
    email?: null | string;
    id: number | string;
    isActive?: boolean;
    lastModificationTime?: null | string;
    lockoutEnabled?: boolean;
    lockoutEnd?: null | string;
    name?: null | string;
    phoneNumber?: null | string;
    userName?: null | string;
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

export async function setIdentityUserPassword(data: IdentityUserApi.SetPasswordPayload) {
  return requestClient.post<IdentityUserApi.SetPasswordResult>(
    '/api/identity/users/set-password',
    data,
    { responseReturn: 'body' },
  );
}
