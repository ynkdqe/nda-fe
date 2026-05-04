export interface AuthTokenInfo {
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  tenant?: null | string;
  token_type: string;
  username?: string;
}

export const AUTH_TOKEN_STORAGE_KEY = 'nda-web-naive-auth-token';

export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

export function getStoredAuthTokenInfo() {
  const rawValue = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthTokenInfo;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return null;
  }
}

export function isAccessTokenExpiring(
  tokenInfo: AuthTokenInfo | null,
  bufferMs = ACCESS_TOKEN_REFRESH_BUFFER_MS,
) {
  return Boolean(
    tokenInfo?.refresh_token && tokenInfo.expires_at <= Date.now() + bufferMs,
  );
}

export function removeStoredAuthTokenInfo() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthTokenInfo(tokenInfo: AuthTokenInfo) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(tokenInfo));
}
