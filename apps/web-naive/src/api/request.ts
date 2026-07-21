/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from '#/adapter/naive';
import { isSsoAuthMode, refreshSsoToken } from '#/auth/sso';
import type { MResult } from '#/models/common';
import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';
import {
  getStoredAuthTokenInfo,
  isAccessTokenExpiring,
  removeStoredAuthTokenInfo,
  setStoredAuthTokenInfo,
} from './core/token';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

let refreshTokenPromise: null | Promise<string> = null;

function isConnectTokenRequest(url?: string) {
  return Boolean(url?.includes('/connect/token'));
}

function getResponseErrorMessage(responseData: unknown, fallbackMessage: string) {
  if (!responseData || typeof responseData !== 'object') {
    return fallbackMessage;
  }

  const result = responseData as Partial<MResult<unknown>>;
  const responseError = result.error;

  if (typeof responseError === 'string') {
    return responseError || fallbackMessage;
  }

  const validationMessages =
    responseError?.validationErrors
      ?.map((item) => item?.message?.trim())
      .filter((item): item is string => Boolean(item)) ?? [];
  const uniqueValidationMessages = [...new Set(validationMessages)];

  if (uniqueValidationMessages.length > 0) {
    return uniqueValidationMessages.join('\n');
  }

  return (
    responseError?.details?.trim() ||
    responseError?.message?.trim() ||
    result.message?.trim() ||
    fallbackMessage
  );
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    removeStoredAuthTokenInfo();
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    if (refreshTokenPromise) {
      return await refreshTokenPromise;
    }

    refreshTokenPromise = (async () => {
      const accessStore = useAccessStore();
      const storedTokenInfo = getStoredAuthTokenInfo();
      const refreshToken =
        accessStore.refreshToken || storedTokenInfo?.refresh_token;

      if (!refreshToken) {
        throw new Error('Refresh token is missing.');
      }

      const resp = isSsoAuthMode()
        ? await refreshSsoToken(refreshToken)
        : await refreshTokenApi(refreshToken);
      const newToken = resp.access_token;
      const newRefreshToken = resp.refresh_token ?? refreshToken;

      setStoredAuthTokenInfo({
        access_token: newToken,
        expires_at: Date.now() + resp.expires_in * 1000,
        expires_in: resp.expires_in,
        id_token: resp.id_token ?? storedTokenInfo?.id_token,
        refresh_token: newRefreshToken,
        scope: resp.scope ?? storedTokenInfo?.scope,
        tenant: storedTokenInfo?.tenant ?? null,
        token_type: resp.token_type,
        username: storedTokenInfo?.username,
      });

      return newToken;
    })();

    try {
      return await refreshTokenPromise;
    } finally {
      refreshTokenPromise = null;
    }
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const storedTokenInfo = getStoredAuthTokenInfo();
      let accessToken =
        accessStore.accessToken || storedTokenInfo?.access_token;

      if (
        !isConnectTokenRequest(config.url) &&
        isAccessTokenExpiring(storedTokenInfo)
      ) {
        try {
          accessToken = await doRefreshToken();
        } catch {
          await doReAuthenticate();
          throw new Error('Unable to refresh access token.');
        }
      }

      if (accessToken && !accessStore.accessToken) {
        accessStore.setAccessToken(accessToken);
      }

      const authorization = isConnectTokenRequest(config.url)
        ? null
        : formatToken(accessToken ?? null);
      if (authorization) {
        config.headers.Authorization = authorization;
      } else {
        delete config.headers.Authorization;
      }
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // HTTP 2xx can still represent a failed business operation.
  client.addResponseInterceptor({
    fulfilled: (response) => {
      const responseData = response?.data;
      const businessSuccess =
        responseData && typeof responseData === 'object'
          ? responseData.success
          : undefined;

      if (businessSuccess === false) {
        const errorMessage = getResponseErrorMessage(
          responseData,
          'Request failed.',
        );
        throw Object.assign(new Error(errorMessage), {
          config: response.config,
          response,
        });
      }

      return response;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const errorMessage = getResponseErrorMessage(error?.response?.data, msg);
      message.error(errorMessage);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
