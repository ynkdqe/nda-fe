import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace AccountApi {
  export interface Profile extends Recordable<any> {
    avatar: null | string;
    id: string;
    name: string;
    permissions?: string[];
    roles?: string[];
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
