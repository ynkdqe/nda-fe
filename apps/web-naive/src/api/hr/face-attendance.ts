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

/** [HR] Danh sách nhân viên kèm trạng thái FaceID. */
export function getFaceEmployeeListApi(
  params?: FaceAttendanceApi.EmployeeListParams,
) {
  return requestClient.get<FaceAttendanceApi.EmployeeListResult>(
    `${PREFIX}/employees`,
    { params, responseReturn: 'body' },
  );
}

/** [HR] Chi tiết FaceID của nhân viên + lượt quét gần nhất. */
export function getFaceEmployeeDetailApi(employeeId: number) {
  return requestClient.get<FaceAttendanceApi.EmployeeDetailResult>(
    `${PREFIX}/employees/${employeeId}`,
    { responseReturn: 'body' },
  );
}

/** [HR] Đăng ký / thay FaceID hộ nhân viên bằng ảnh. */
export function enrollFaceForEmployeeApi(
  employeeId: number,
  input: FaceAttendanceApi.EnrollInput,
) {
  const form = new FormData();
  form.append('image', input.image, 'face.jpg');
  form.append('consent', String(input.consent === true));

  return requestClient.post<FaceAttendanceApi.EmployeeDetailResult>(
    `${PREFIX}/employees/${employeeId}/enroll`,
    form,
    {
      headers: { 'Content-Type': null },
      responseReturn: 'body',
      timeout: 60_000,
    },
  );
}

/** [HR] Xoá (reset) FaceID của nhân viên. */
export function deleteEmployeeFaceApi(employeeId: number) {
  return requestClient.delete<FaceAttendanceApi.MutationResult>(
    `${PREFIX}/employees/${employeeId}`,
    { responseReturn: 'body' },
  );
}

/** [HR] Lịch sử lượt quét FaceID. */
export function getFaceAttemptListApi(
  params?: FaceAttendanceApi.AttemptListParams,
) {
  return requestClient.get<FaceAttendanceApi.AttemptListResult>(
    `${PREFIX}/attempts`,
    { params, responseReturn: 'body' },
  );
}
