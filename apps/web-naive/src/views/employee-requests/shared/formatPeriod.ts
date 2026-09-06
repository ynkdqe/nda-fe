import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';

import {
  DayPart,
  dayPartLabels,
} from '#/models/employee-requests/employee-request';
import { formatDateOnly, formatTimeOnly } from '#/utils/date';

/**
 * Hiển thị một khoảng thời gian của đơn theo đúng dạng đã nhập.
 *
 * Giờ chỉ được lưu khi nghỉ theo giờ, nên không thể in cứng "từ ngày X giờ Y đến
 * ngày Z giờ W" như trước — phần lớn đơn sẽ ra giờ rỗng.
 */
export function formatPeriod(
  period: Pick<
    EmployeeRequestApi.Period,
    'dayPart' | 'fromDate' | 'fromTime' | 'toDate' | 'toTime'
  >,
): string {
  const from = formatDateOnly(period.fromDate);
  const to = formatDateOnly(period.toDate);
  const sameDay = period.fromDate === period.toDate;

  if (period.dayPart === DayPart.Custom) {
    const fromTime = formatTimeOnly(period.fromTime) || '';
    const toTime = formatTimeOnly(period.toTime) || '';
    return `${from} ${fromTime} → ${toTime}`.replace(/\s+/g, ' ').trim();
  }

  const range = sameDay ? from : `${from} → ${to}`;

  return period.dayPart === DayPart.FullDay
    ? range
    : `${range} (${dayPartLabels[period.dayPart]})`;
}
