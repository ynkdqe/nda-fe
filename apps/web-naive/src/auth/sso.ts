import type { AuthTokenInfo } from '#/api/core/token';

import { useAppConfig } from '@vben/hooks';

export interface OpenIdConfiguration {
  authorization_endpoint: string;
  end_session_endpoint?: string;
  issuer: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
}

interface AuthorizationTransaction {
  codeVerifier: string;
  redirectPath: string;
  state: string;
}

interface SsoTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

const DEFAULT_CLIENT_ID = 'NDA_App';
const DEFAULT_SCOPE =
  'openid offline_access profile email phone address roles nda';
const TRANSACTION_STORAGE_KEY = 'web-naive:sso-authorization-transaction';

let discoveryPromise: null | Promise<OpenIdConfiguration> = null;

export function isSsoAuthMode() {
  return import.meta.env.VITE_AUTH_MODE?.toLowerCase() === 'sso';
}

function getAuthority() {
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  return (import.meta.env.VITE_SSO_AUTHORITY || apiURL).replace(/\/?$/, '/');
}

function getClientId() {
  return import.meta.env.VITE_SSO_CLIENT_ID || DEFAULT_CLIENT_ID;
}

function getScope() {
  return (
    import.meta.env.VITE_SSO_SCOPE ||
    import.meta.env.VITE_APP_SCOPE ||
    DEFAULT_SCOPE
  );
}

function getRedirectUri() {
  return (
    import.meta.env.VITE_SSO_REDIRECT_URI ||
    `${window.location.origin}/signin-callback`
  );
}

function getPostLogoutRedirectUri() {
  return (
    import.meta.env.VITE_SSO_POST_LOGOUT_REDIRECT_URI ||
    `${window.location.origin}/signout-callback`
  );
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function createRandomValue(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  return encodeBase64Url(new Uint8Array(digest));
}

function normalizeRedirectPath(redirectPath?: string) {
  if (!redirectPath) {
    return '/';
  }

  try {
    const decodedPath = decodeURIComponent(redirectPath);
    return decodedPath.startsWith('/') && !decodedPath.startsWith('//')
      ? decodedPath
      : '/';
  } catch {
    return '/';
  }
}

function storeAuthorizationTransaction(transaction: AuthorizationTransaction) {
  sessionStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transaction));
}

function takeAuthorizationTransaction() {
  const value = sessionStorage.getItem(TRANSACTION_STORAGE_KEY);
  sessionStorage.removeItem(TRANSACTION_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthorizationTransaction;
  } catch {
    return null;
  }
}

export async function getOpenIdConfiguration() {
  discoveryPromise ??= fetch(
    new URL('.well-known/openid-configuration', getAuthority()),
    {
      headers: { Accept: 'application/json' },
    },
  ).then(async (response) => {
    if (!response.ok) {
      throw new Error('Unable to load the OpenID Connect configuration.');
    }
    return (await response.json()) as OpenIdConfiguration;
  });

  return await discoveryPromise;
}

export async function redirectToSsoLogin(redirectPath?: string) {
  const configuration = await getOpenIdConfiguration();
  const codeVerifier = createRandomValue(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = createRandomValue();

  storeAuthorizationTransaction({
    codeVerifier,
    redirectPath: normalizeRedirectPath(redirectPath),
    state,
  });

  const authorizeUrl = new URL(configuration.authorization_endpoint);
  authorizeUrl.search = new URLSearchParams({
    client_id: getClientId(),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: getScope(),
    state,
  }).toString();

  window.location.assign(authorizeUrl.toString());
}

export async function completeSsoLogin(search: string) {
  const parameters = new URLSearchParams(search);
  const error = parameters.get('error');
  if (error) {
    throw new Error(
      parameters.get('error_description') || `SSO login failed: ${error}`,
    );
  }

  const code = parameters.get('code');
  const state = parameters.get('state');
  const transaction = takeAuthorizationTransaction();

  if (!code || !state || !transaction || state !== transaction.state) {
    throw new Error('Invalid or expired SSO authorization response.');
  }

  const configuration = await getOpenIdConfiguration();
  const response = await fetch(configuration.token_endpoint, {
    body: new URLSearchParams({
      client_id: getClientId(),
      code,
      code_verifier: transaction.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  const token = (await response.json()) as SsoTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok || token.error) {
    throw new Error(
      token.error_description || token.error || 'Unable to exchange SSO code.',
    );
  }

  return {
    redirectPath: transaction.redirectPath,
    tokenInfo: {
      access_token: token.access_token,
      expires_at: Date.now() + token.expires_in * 1000,
      expires_in: token.expires_in,
      id_token: token.id_token,
      refresh_token: token.refresh_token,
      scope: token.scope || getScope(),
      tenant: null,
      token_type: token.token_type,
    } satisfies AuthTokenInfo,
  };
}

export async function refreshSsoToken(refreshToken: string) {
  const configuration = await getOpenIdConfiguration();
  const response = await fetch(configuration.token_endpoint, {
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: getScope(),
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  const token = (await response.json()) as SsoTokenResponse & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok || token.error) {
    throw new Error(
      token.error_description || token.error || 'Unable to refresh SSO token.',
    );
  }

  return token;
}

export async function redirectToSsoLogout(idToken?: null | string) {
  const configuration = await getOpenIdConfiguration();
  if (!configuration.end_session_endpoint) {
    window.location.replace(getPostLogoutRedirectUri());
    return;
  }

  const logoutUrl = new URL(configuration.end_session_endpoint);
  logoutUrl.searchParams.set(
    'post_logout_redirect_uri',
    getPostLogoutRedirectUri(),
  );
  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  } else {
    logoutUrl.searchParams.set('client_id', getClientId());
  }

  window.location.replace(logoutUrl.toString());
}
