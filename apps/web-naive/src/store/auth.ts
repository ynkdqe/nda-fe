import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { notification } from '#/adapter/naive';
import {
  getUserInfoApi,
  loginApi,
  logoutApi,
  removeStoredAuthTokenInfo,
  setStoredAuthTokenInfo,
} from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  function normalizeUserInfo(
    profile: Recordable<any>,
    token: string,
  ): UserInfo {
    return {
      ...profile,
      avatar: profile.avatar || preferences.app.defaultAvatar,
      desc: profile.desc ?? profile.email ?? '',
      homePath: profile.homePath ?? preferences.app.defaultHomePath,
      realName: profile.name || profile.userName || profile.username || '',
      roles: profile.roles ?? [],
      token,
      userId: profile.id ?? profile.userId ?? '',
      username: profile.userName ?? profile.username ?? '',
    };
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);
      const accessToken = loginResult.access_token;

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 token 存储到 core-access store，由 pinia persist 写入 localStorage
        setStoredAuthTokenInfo({
          access_token: accessToken,
          expires_at: Date.now() + loginResult.expires_in * 1000,
          expires_in: loginResult.expires_in,
          refresh_token: loginResult.refresh_token,
          scope: import.meta.env.VITE_APP_SCOPE,
          tenant: params.tenant ?? null,
          token_type: loginResult.token_type,
          username: params.username,
        });

        userInfo = await fetchUserInfo();

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            content: $t('authentication.loginSuccess'),
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3000,
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    removeStoredAuthTokenInfo();
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const profile = await getUserInfoApi();
    const userInfo = normalizeUserInfo(profile, accessStore.accessToken ?? '');
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(profile.permissions ?? []);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
