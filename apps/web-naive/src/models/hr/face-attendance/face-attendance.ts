import type { MResult } from '#/models/common';

/** Contract của backend `/api/hrms/face-attendance` (FaceAttendanceAppService). */
export namespace FaceAttendanceApi {
  /** Mã kết quả trả về trong `FaceCheckInResultDto.code`. */
  export type CheckInCode =
    | 'AlreadyExists'
    | 'ConsentRequired'
    | 'EmployeeNotFound'
    | 'EngineError'
    | 'Enrolled'
    | 'InvalidImage'
    | 'LowQuality'
    | 'MultipleFaces'
    | 'NoFace'
    | 'NotMatch'
    | 'Verified';

  /** `ENROLLED`: lần đầu đăng ký FaceID + chấm công; `VERIFIED`: chấm công. */
  export type CheckInAction = 'ENROLLED' | 'VERIFIED';

  /** Maps FaceStatusDto (GET /me). */
  export interface Status {
    employeeCode: null | string;
    employeeName: null | string;
    enrolled: boolean;
    enrolledAt: null | string;
    lastCheckInTime: null | string;
  }

  /** Maps FaceCheckInResultDto (POST /check-in). */
  export interface CheckInResult {
    action: CheckInAction | null;
    attendanceLogId: null | string;
    code: CheckInCode;
    /** Thời điểm chấm công (UTC, giờ server). */
    eventTime: null | string;
    /** Trả lại kết quả của lượt thành công gần nhất khi bấm lặp trong thời gian debounce. */
    isDuplicateRequest: boolean;
    /** % hiển thị (đúng ngưỡng = 85%), chỉ có khi xác thực. */
    scorePercent: null | number;
  }

  /** Form multipart gửi lên POST /check-in. */
  export interface CheckInInput {
    appVersion?: string;
    /** Bắt buộc `true` ở lần đăng ký đầu tiên. */
    consent?: boolean;
    deviceId?: string;
    /** Ảnh JPEG/PNG, tối đa 1MB (FE nén còn ~500KB). */
    image: Blob;
  }

  export type StatusResult = MResult<Status>;
  export type CheckInResponse = MResult<CheckInResult>;
}
