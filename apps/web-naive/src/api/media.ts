import type { MediaApi } from '#/models/media';

import { requestClient } from '#/api/request';

/**
 * Tải file lên và nhận về URL. Các entity nghiệp vụ chỉ lưu URL string,
 * không tự nhận file — đây là quy ước chung của backend.
 *
 * Cố ý không đặt tay header Content-Type: axios tự sinh
 * `multipart/form-data; boundary=...` cho FormData, đặt tay sẽ mất boundary
 * và server không tách được field.
 */
export function uploadMediaApi(file: File) {
  const form = new FormData();
  form.append('file', file);

  return requestClient.post<MediaApi.UploadResult>('/api/media/upload', form, {
    responseReturn: 'body',
  });
}
