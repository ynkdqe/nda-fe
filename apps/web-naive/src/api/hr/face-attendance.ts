import type { FaceAttendanceApi } from '#/models/hr/face-attendance';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/face-attendance';

/** Trạng thái FaceID của user hiện tại (đã đăng ký chưa, lần chấm công gần nhất). */
export function getFaceAttendanceStatusApi() {
  return requestClient.get<FaceAttendanceApi.StatusResult>(`${PREFIX}/me`, {
    responseReturn: 'body',
  });
}

/** Chấm công bằng khuôn mặt; lần đầu backend sẽ đăng ký FaceID. */
export function faceCheckInApi(input: FaceAttendanceApi.CheckInInput) {
  const form = new FormData();
  form.append('image', input.image, 'face.jpg');
  if (input.deviceId) form.append('deviceId', input.deviceId);
  if (input.appVersion) form.append('appVersion', input.appVersion);
  form.append('consent', String(input.consent === true));

  return requestClient.post<FaceAttendanceApi.CheckInResponse>(
    `${PREFIX}/check-in`,
    form,
    {
      // Gỡ header JSON mặc định để browser tự sinh multipart boundary.
      headers: { 'Content-Type': null },
      responseReturn: 'body',
      timeout: 60_000,
    },
  );
}
