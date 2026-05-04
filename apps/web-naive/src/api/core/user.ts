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
  return requestClient.get<AccountApi.Profile>('/api/account/profile', {
    responseReturn: 'body',
  });
}
