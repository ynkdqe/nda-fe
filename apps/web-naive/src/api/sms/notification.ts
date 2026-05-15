import { requestClient } from "#/api/request";

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
    creatorId?: string;
    creatorName?: string;
    icon?: string;
    id?: string;
    isSystem?: boolean;
    message?: string;
    notificationReceivers?: NotificationReceiver[];
    senderId?: null | string;
    senderName?: null | string;
    senderUserName?: null | string;
    title?: string;
    type?: 0 | 1;
    url?: null | string;
  }

  export interface NotificationUserItem {
    creationTime?: string;
    icon?: string;
    id?: string;
    message?: string;
    senderName?: null | string;
    status?: number;
    title?: string;
  }

  export interface NotificationListParams {
    endDate?: string;
    keyword?: string;
    page: number;
    pageSize: number;
    startDate?: string;
    status?: number | string;
  }

  export interface NotificationListResult<T = NotificationUserItem> {
    current?: number;
    data?: T[];
    dataExtend?: unknown;
    items?: T[];
    message?: null | string;
    pageSize?: number;
    success?: boolean;
    total?: number;
  }
}

export async function fetchNotificationList(params: SmsNotificationApi.NotificationListParams) {
  return requestClient.get<
    SmsNotificationApi.NotificationListResult<SmsNotificationApi.NotificationUserItem>
  >("/api/sms/notification", {
    params,
    responseReturn: "body",
  });
}

export async function fetchAdminNotificationList(
  params: SmsNotificationApi.NotificationListParams,
) {
  return requestClient.get<
    SmsNotificationApi.NotificationListResult<SmsNotificationApi.NotificationItem>
  >("/api/sms/notification", {
    params,
    responseReturn: "body",
  });
}

export async function createNotification(data: Record<string, any>) {
  return requestClient.post("/api/sms/notification", data, {
    responseReturn: "body",
  });
}

export async function updateNotificationStatus(ids: string[], status: 0 | 1) {
  return requestClient.put(
    "/api/sms/notification/status",
    { ids, status },
    { responseReturn: "body" },
  );
}

export async function deleteNotification(id: string) {
  return requestClient.delete(`/api/sms/notification/${id}`, {
    responseReturn: "body",
  });
}

export async function deleteNotifications(ids: string[]) {
  return requestClient.delete("/api/sms/notification", {
    data: { ids },
    responseReturn: "body",
  });
}
