import { requestClient } from '#/api/request';

export interface RolePayload {
  concurrencyStamp?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  name: string;
}

export async function createRole(payload: RolePayload) {
  return requestClient.post('/api/identity/roles', payload);
}

export async function editRole(id: string, payload: RolePayload) {
  return requestClient.put(`/api/identity/roles/${id}`, payload);
}

export async function deleteRole(id: string) {
  return requestClient.delete(`/api/identity/roles/${id}`);
}
