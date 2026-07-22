import type { MResult } from '#/models/common';

import { requestClient } from '#/api/request';

export namespace SmsNotificationApi {
  export interface NotificationReceiver {
    email?: string;
    id?: string;
    name?: string;
    readAt?: null | string;
    status?: boolean | null | number | string;
    userId?: string;
    userName?: string;
  }

  export interface NotificationItem {
    creationTime?: string;
    creatorId?: null | string;
    creatorName?: null | string;
    icon?: null | string;
    id?: string;
    isSystem?: boolean;
    message?: string;
    notificationReceivers?: NotificationReceiver[];
    senderId?: null | string;
    senderName?: null | string;
    senderUserName?: null | string;
    status?: boolean | null | number | string;
    title?: string;
    type?: number;
    url?: null | string;
  }

  export interface NotificationHubItem extends NotificationItem {
    CreationTime?: string;
    CreatorId?: null | string;
    CreatorName?: null | string;
    Icon?: null | string;
    Id?: string;
    IsSystem?: boolean;
    Message?: string;
    SenderId?: null | string;
    SenderName?: null | string;
    SenderUserName?: null | string;
    Status?: boolean | null | number | string;
    Title?: string;
    Type?: number;
    Url?: null | string;
  }

  export interface NotificationUserItem {
    creationTime?: string;
    creatorId?: null | string;
    creatorName?: null | string;
    icon?: null | string;
    id?: string;
    message?: string;
    name?: null | string;
    readAt?: null | string;
    senderId?: null | string;
    senderName?: null | string;
    senderUserName?: null | string;
    status?: number;
    title?: string;
    totalCount?: number;
    type?: number;
    unreadCount?: number;
    url?: null | string;
    userId?: null | string;
    userName?: null | string;
  }

  export interface NotificationListParams {
    endDate?: string;
    keyword?: string;
    page: number;
    pageSize: number;
    startDate?: string;
    status?: number | string;
  }

  export interface NotificationDataExtend {
    unreadCount?: number;
    [key: string]: unknown;
  }

  export type NotificationListResult<T = NotificationUserItem> = MResult<
    T[],
    NotificationDataExtend
  >;
}

export async function fetchNotificationList(params: SmsNotificationApi.NotificationListParams) {
  return requestClient.get<
    SmsNotificationApi.NotificationListResult<SmsNotificationApi.NotificationUserItem>
  >('/api/sms/notification', {
    params,
    responseReturn: 'body',
  });
}

export async function fetchNotificationUserList(
  params: Pick<SmsNotificationApi.NotificationListParams, 'pageSize'> & {
    current: number;
  },
) {
  return requestClient.get<
    SmsNotificationApi.NotificationListResult<SmsNotificationApi.NotificationUserItem>
  >('/api/sms/notification-user', {
    params,
    responseReturn: 'body',
  });
}

export async function fetchAdminNotificationList(
  params: SmsNotificationApi.NotificationListParams,
) {
  return requestClient.get<
    SmsNotificationApi.NotificationListResult<SmsNotificationApi.NotificationItem>
  >('/api/sms/notification', {
    params,
    responseReturn: 'body',
  });
}

export async function createNotification(data: Record<string, any>) {
  return requestClient.post('/api/sms/notification', data, {
    responseReturn: 'body',
  });
}

export enum NotificationStatusEnum {
  Unread = 0,
  Read = 1,
  Hide = 2,
}

export async function updateNotificationStatus(
  status: NotificationStatusEnum,
  ids?: string[],
) {
  return requestClient.post<MResult<unknown>>(
    '/api/sms/notification/status',
    ids ? { ids, status } : { status },
    { responseReturn: 'body' },
  );
}

export async function deleteNotification(id: string) {
  return requestClient.delete(`/api/sms/notification/${id}`, {
    responseReturn: 'body',
  });
}

export async function deleteNotifications(ids: string[]) {
  return requestClient.delete('/api/sms/notification', {
    data: { ids },
    responseReturn: 'body',
  });
}
