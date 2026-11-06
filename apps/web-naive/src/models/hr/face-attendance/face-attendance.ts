import type { MResult } from '#/models/common';

/** Thứ tự khớp FaceAttemptTypeEnum của backend (index = giá trị số). */
export const FACE_ATTEMPT_TYPES = ['Enroll', 'Verify'] as const;

/** Thứ tự khớp FaceAttemptResultEnum của backend (index = giá trị số). */
export const FACE_ATTEMPT_RESULTS = [
  'Enrolled',
  'Verified',
  'NotMatch',
  'Duplicate',
  'NoFace',
  'MultipleFaces',
  'LowQuality',
  'InvalidImage',
  'ConsentRequired',
  'EngineError',
] as const;

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
    /** Mức % tối thiểu để đạt (= 85). */
    passPercent: number;
    /** % hiển thị (đúng ngưỡng = 85%), chỉ có khi xác thực (kể cả khi không khớp). */
    scorePercent: null | number;
    /** Cosine similarity thật (0–1), chỉ có khi xác thực. */
    similarity: null | number;
  }

  /** FaceAttemptTypeEnum — backend serialize dạng số (index trong FACE_ATTEMPT_TYPES). */
  export type AttemptType = 0 | 1;

  /** FaceAttemptResultEnum — backend serialize dạng số (index trong FACE_ATTEMPT_RESULTS). */
  export type AttemptResult = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  export type AttemptTypeCode = (typeof FACE_ATTEMPT_TYPES)[number];
  export type AttemptResultCode = (typeof FACE_ATTEMPT_RESULTS)[number];

  /** Maps EmployeeFaceItemDto (GET /employees). */
  export interface EmployeeFaceItem {
    avatar: null | string;
    consentAccepted: boolean | null;
    detScore: null | number;
    employeeCode: null | string;
    employeeId: number;
    employeeName: null | string;
    employeeStatus: null | string;
    enrolled: boolean;
    enrolledAt: null | string;
    enrolledById: null | string;
    faceId: null | string;
    /** Ảnh dùng để đăng ký FaceID. */
    imageUrl: null | string;
    lastCheckInTime: null | string;
    modelName: null | string;
    /** `true`: nhân viên tự đăng ký; `false`: HR đăng ký hộ; `null`: chưa đăng ký. */
    selfEnrolled: boolean | null;
    userId: null | string;
    userName: null | string;
  }

  /** Maps FaceAttemptDto (GET /attempts, RecentAttempts). */
  export interface AttemptItem {
    appVersion: null | string;
    attendanceLogId: null | string;
    creationTime: string;
    deviceId: null | string;
    employeeCode: null | string;
    employeeId: null | number;
    employeeName: null | string;
    id: string;
    imageUrl: null | string;
    latencyMs: number;
    matchedEmployeeId: null | number;
    modelName: null | string;
    result: AttemptResult;
    score: null | number;
    scorePercent: null | number;
    type: AttemptType;
    userId: null | string;
  }

  /** Maps EmployeeFaceDetailDto (GET /employees/{employeeId}). */
  export interface EmployeeFaceDetail extends EmployeeFaceItem {
    recentAttempts: AttemptItem[];
  }

  /** Query của GET /employees (BaseFilterDto). */
  export interface EmployeeListParams {
    current?: number;
    keyword?: string;
    pageSize?: number;
    status?: 'enrolled' | 'notEnrolled';
  }

  /** Query của GET /attempts (BaseFilterDto: id = employeeId, type, status = kết quả). */
  export interface AttemptListParams {
    current?: number;
    endDate?: string;
    id?: string;
    keyword?: string;
    pageSize?: number;
    startDate?: string;
    status?: AttemptResultCode;
    type?: AttemptTypeCode;
  }

  /** Form multipart POST /employees/{employeeId}/enroll. */
  export interface EnrollInput {
    /** HR xác nhận đã có đồng ý xử lý dữ liệu khuôn mặt của nhân viên. */
    consent: boolean;
    image: Blob;
  }

  export type EmployeeListResult = MResult<EmployeeFaceItem[]>;
  export type EmployeeDetailResult = MResult<EmployeeFaceDetail>;
  export type AttemptListResult = MResult<AttemptItem[]>;
  export type MutationResult = MResult<unknown>;

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
