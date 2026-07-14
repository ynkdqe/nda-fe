import type { TenantManagementApi } from '#/models/tenant-management';

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

function createMutationHeaders(includeContentType = false) {
  const token =
    getCookieValue('RequestVerificationToken') ??
    getCookieValue('__RequestVerificationToken') ??
    getCookieValue('XSRF-TOKEN');
  const headers: Record<string, string> = {
    Accept: includeContentType ? 'text/plain' : '*/*',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.RequestVerificationToken = decodeURIComponent(token);
  }

  return headers;
}

export async function getTenantProfileByIdApi(id: string) {
  return requestClient.get<TenantManagementApi.TenantDetailResult>(
    `/api/tenant-management/tenants/${id}/profile`,
    {
      responseReturn: 'body',
    },
  );
}

export async function updateTenantProfileApi(
  tenantId: string,
  data: TenantManagementApi.UpdateTenantProfileParams,
) {
  return requestClient.put(
    `/api/tenant-management/tenants/${tenantId}/profile`,
    data,
    {
      headers: createMutationHeaders(true),
      responseReturn: 'body',
    },
  );
}

export async function deleteTenantApi(tenantId: string) {
  return requestClient.delete(`/api/tenant-management/tenants/${tenantId}`, {
    headers: createMutationHeaders(),
    responseReturn: 'body',
  });
}

export async function getTenantsWithProfileApi(
  params: TenantManagementApi.TenantListParams,
) {
  return requestClient.get<TenantManagementApi.TenantListResult>(
    '/api/tenant-management/tenants/with-profile',
    {
      params,
      responseReturn: 'body',
    },
  );
}
