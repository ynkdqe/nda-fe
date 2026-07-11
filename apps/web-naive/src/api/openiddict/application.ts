import type { OpenIddictApplicationApi } from '#/models/openiddict';

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

export async function getOpenIddictApplicationsApi(
  params: OpenIddictApplicationApi.ApplicationListParams,
) {
  return requestClient.get<OpenIddictApplicationApi.ApplicationListResult>(
    '/api/openiddict/applications',
    {
      params,
      responseReturn: 'body',
    },
  );
}

function createRequestHeaders(includeContentType = false) {
  const requestVerificationToken = getRequestVerificationToken();
  const headers: Record<string, string> = {
    Accept: 'text/plain',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (requestVerificationToken) {
    headers.RequestVerificationToken = requestVerificationToken;
  }

  return headers;
}

export async function getOpenIddictApplicationByIdApi(id: string) {
  return requestClient.get<OpenIddictApplicationApi.ApplicationDetailResult>(
    `/api/openiddict/applications/${id}`,
    {
      headers: createRequestHeaders(),
      responseReturn: 'body',
    },
  );
}

export async function createOpenIddictApplicationApi(
  data: OpenIddictApplicationApi.CreateApplicationParams,
) {
  return requestClient.post('/api/openiddict/applications', data, {
    headers: createRequestHeaders(true),
    responseReturn: 'body',
  });
}

export async function updateOpenIddictApplicationApi(
  id: string,
  data: OpenIddictApplicationApi.UpdateApplicationParams,
) {
  return requestClient.put(`/api/openiddict/applications/${id}`, data, {
    headers: createRequestHeaders(true),
    responseReturn: 'body',
  });
}

export async function deleteOpenIddictApplicationApi(id: string) {
  return requestClient.delete(`/api/openiddict/applications/${id}`, {
    headers: createRequestHeaders(),
    responseReturn: 'body',
  });
}
