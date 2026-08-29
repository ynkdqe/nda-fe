export type TimestampValue = null | number | string | undefined;

export function toTimestamp(value: TimestampValue): null | number {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Chuyển timestamp của date picker sang chuỗi `yyyy-MM-dd` cho DateOnly của backend.
 * Dùng giờ local thay vì toISOString để không bị lùi/tiến một ngày theo timezone.
 */
export function toDateOnlyString(value: TimestampValue): null | string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) {
    return null;
  }

  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Chuyển timestamp của time picker sang chuỗi `HH:mm:ss` cho TimeOnly của backend.
 */
export function toTimeOnlyString(value: TimestampValue): null | string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) {
    return null;
  }

  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Hiển thị `yyyy-MM-dd` (DateOnly) thành `dd/MM/yyyy`. */
export function formatDateOnly(value: null | string | undefined): string {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('T')[0]?.split('-') ?? [];
  return year && month && day ? `${day}/${month}/${year}` : value;
}

/** Hiển thị `HH:mm:ss` (TimeOnly) thành `HH:mm`. */
export function formatTimeOnly(value: null | string | undefined): string {
  if (!value) {
    return '';
  }

  const [hour, minute] = value.split(':');
  return hour && minute ? `${hour}:${minute}` : value;
}

/** Hiển thị chuỗi datetime ISO thành `dd/MM/yyyy HH:mm`. */
export function formatDateTime(value: null | string | undefined): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) {
    return '';
  }

  const date = new Date(timestamp);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
