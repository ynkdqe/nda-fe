import { useAccessStore } from '@vben/stores';

export interface AuthTokenInfo {
  access_token: string;
  expires_at: number;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  tenant?: null | string;
  token_type: string;
  username?: string;
}

export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'nda-web-naive-auth-token';

function removeLegacyAuthTokenInfo() {
  localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthTokenInfo() {
  removeLegacyAuthTokenInfo();
  const accessStore = useAccessStore();

  if (!accessStore.accessToken) {
    return null;
  }

  return {
    access_token: accessStore.accessToken,
    expires_at: accessStore.expiresAt ?? 0,
    expires_in: accessStore.expiresIn ?? 0,
    id_token: accessStore.idToken ?? undefined,
    refresh_token: accessStore.refreshToken ?? undefined,
    scope: accessStore.scope,
    tenant: accessStore.tenant ?? null,
    token_type: accessStore.tokenType ?? 'Bearer',
    username: accessStore.username,
  } satisfies AuthTokenInfo;
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
  removeLegacyAuthTokenInfo();
  const accessStore = useAccessStore();
  accessStore.clearAuthTokenInfo();
}

export function setStoredAuthTokenInfo(tokenInfo: AuthTokenInfo) {
  removeLegacyAuthTokenInfo();
  const accessStore = useAccessStore();
  accessStore.setTokenInfo({
    accessToken: tokenInfo.access_token,
    expiresAt: tokenInfo.expires_at,
    expiresIn: tokenInfo.expires_in,
    idToken: tokenInfo.id_token ?? null,
    refreshToken: tokenInfo.refresh_token ?? null,
    scope: tokenInfo.scope,
    tenant: tokenInfo.tenant ?? null,
    tokenType: tokenInfo.token_type,
    username: tokenInfo.username,
  });
}
