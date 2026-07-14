import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  return (
    document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split('=')[1] ?? null
  );
}

function getRequestVerificationToken() {
  const token =
    getCookieValue('RequestVerificationToken') ??
    getCookieValue('__RequestVerificationToken') ??
    getCookieValue('XSRF-TOKEN');

  return token ? decodeURIComponent(token) : null;
}

export namespace AccountApi {
  export interface ChangePasswordParams {
    currentPassword: string;
    newPassword: string;
  }

  export interface TenantProfile {
    logoUrl?: null | string;
  }

  export interface Tenant {
    id: string;
    name?: null | string;
    profile?: null | TenantProfile;
  }

  export interface Profile extends Recordable<any> {
    avatar: null | string;
    id: string;
    name: string;
    permissions?: string[];
    roles?: string[];
    tenant?: null | Tenant;
    tenantId?: null | string;
    userName: string;
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const response = await requestClient.get<any>('/api/account/profile', {
    responseReturn: 'body',
  });
  return response.data as AccountApi.Profile;
}

/**
 * 更新用户信息
 */
export async function updateUserInfoApi(data: any) {
  return requestClient.put('/api/account/profile', data);
}

/**
 * Đổi mật khẩu tài khoản hiện tại
 */
export async function changePasswordApi(data: AccountApi.ChangePasswordParams) {
  const requestVerificationToken = getRequestVerificationToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (requestVerificationToken) {
    headers.RequestVerificationToken = requestVerificationToken;
  }

  return requestClient.post('/api/account/my-profile/change-password', data, {
    headers,
    responseReturn: 'body',
  });
}
