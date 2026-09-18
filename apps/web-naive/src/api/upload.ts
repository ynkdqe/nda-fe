import type { UploadApi } from '#/models/media/upload';

import { message } from '#/adapter/naive';
import { $t } from '#/locales';

import { requestClient } from './request';

function fail(key: string): never {
  const text = $t(key);
  message.error(text);
  throw new Error(text);
}

/** Upload directly to the configured service, sharing the existing auth interceptors. */
export async function uploadProfileAvatarApi(file: File): Promise<string> {
  const configuredUrl = import.meta.env.VITE_APP_UPLOAD_URL?.trim();
  let endpoint: URL;
  try {
    endpoint = new URL(configuredUrl || '');
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) {
      throw new Error('Invalid upload endpoint');
    }
  } catch {
    return fail('page.profile.avatarUpload.invalidEndpoint');
  }
  endpoint.searchParams.set('storage', 'oci');

  const form = new FormData();
  form.append('file', file);
  const result = await requestClient.post<UploadApi.Result>(
    endpoint.toString(),
    form,
    {
      // Override RequestClient's JSON default; the browser supplies the multipart boundary.
      headers: { 'Content-Type': null },
      responseReturn: 'body',
      timeout: 120_000,
    },
  );

  const url = typeof result?.data?.url === 'string' ? result.data.url.trim() : '';
  if (result?.success !== true || !url) {
    return fail('page.profile.avatarUpload.invalidResponse');
  }
  try {
    if (new URL(url).protocol !== 'https:') throw new Error('Invalid image URL');
  } catch {
    return fail('page.profile.avatarUpload.invalidResponse');
  }
  return url;
}
