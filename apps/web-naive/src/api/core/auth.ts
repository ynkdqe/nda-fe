import { baseRequestClient, requestClient } from "#/api/request";

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    tenant?: null | string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
  }

  export type RefreshTokenResult = LoginResult;
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const body = new URLSearchParams({
    client_id: import.meta.env.VITE_APP_CLIENT_ID ?? "",
    client_secret: import.meta.env.VITE_APP_CLIENT_SECRET ?? "",
    grant_type: import.meta.env.VITE_APP_GRANT_TYPE ?? "",
    password: data.password ?? "",
    scope: import.meta.env.VITE_APP_SCOPE ?? "",
    tenant: data.tenant ?? "",
    username: data.username ?? "",
  });

  return requestClient.post<AuthApi.LoginResult>("/connect/token", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(data.tenant ? { "x-tenant-id": data.tenant } : {}),
    },
    responseReturn: "body",
  });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: import.meta.env.VITE_APP_CLIENT_ID ?? "",
    client_secret: import.meta.env.VITE_APP_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: import.meta.env.VITE_APP_SCOPE ?? "",
  });

  return requestClient.post<AuthApi.RefreshTokenResult>("/connect/token", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    responseReturn: "body",
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post("/auth/logout", {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>("/auth/codes");
}
