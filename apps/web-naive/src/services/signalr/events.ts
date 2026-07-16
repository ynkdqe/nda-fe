export const REALTIME_MESSAGE_TYPE = {
  NOTIFICATION: 'notification',
} as const;

export const NOTIFICATION_REALTIME_EVENT = {
  DELETED: 'deleted',
  NEW: 'new',
  STATUS: 'status',
} as const;

export type NotificationRealtimeEvent =
  (typeof NOTIFICATION_REALTIME_EVENT)[keyof typeof NOTIFICATION_REALTIME_EVENT];
