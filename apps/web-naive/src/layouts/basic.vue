<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { SmsNotificationApi } from '#/api/sms/notification';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { VBEN_DOC_URL, VBEN_GITHUB_URL } from '@vben/constants';
import { useWatermark } from '@vben/hooks';
import { BookOpenText, CircleHelp, SvgGithubIcon } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { formatDate, openWindow } from '@vben/utils';

import { fetchNotificationUserList, updateNotificationStatus } from '#/api';
import { $t } from '#/locales';
import {
  requestBrowserNotificationPermissionOnInteraction,
  showBrowserNotification,
} from '#/services/browser-notification';
import {
  NOTIFICATION_REALTIME_EVENT,
  REALTIME_MESSAGE_TYPE,
} from '#/services/signalr';
import { useAuthStore, useRealtimeStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const realtimeStore = useRealtimeStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();
const showDot = computed(() => unreadCount.value > 0);
let cleanupNotificationPermissionRequest: (() => void) | null = null;

function getHubNotificationValue<T>(
  item: SmsNotificationApi.NotificationHubItem,
  camelCaseKey: keyof SmsNotificationApi.NotificationItem,
  pascalCaseKey: keyof SmsNotificationApi.NotificationHubItem,
) {
  return (item[camelCaseKey] ?? item[pascalCaseKey]) as T | undefined;
}

function mapNotificationItem(
  item:
    | SmsNotificationApi.NotificationHubItem
    | SmsNotificationApi.NotificationUserItem,
): NotificationItem {
  const hubItem = item as SmsNotificationApi.NotificationHubItem;
  const id =
    getHubNotificationValue<string>(hubItem, 'id', 'Id') ??
    crypto.randomUUID?.() ??
    String(Math.random());
  const icon = getHubNotificationValue<null | string>(hubItem, 'icon', 'Icon');
  const creationTime = getHubNotificationValue<string>(
    hubItem,
    'creationTime',
    'CreationTime',
  );
  const message = getHubNotificationValue<string>(
    hubItem,
    'message',
    'Message',
  );
  const status = getHubNotificationValue<boolean | null | number | string>(
    hubItem,
    'status',
    'Status',
  );
  const title = getHubNotificationValue<string>(hubItem, 'title', 'Title');
  const url = getHubNotificationValue<null | string>(hubItem, 'url', 'Url');
  return {
    id,
    avatar: icon || `https://avatar.vercel.sh/${encodeURIComponent(id)}`,
    date: creationTime
      ? (formatDate(creationTime, 'DD-MM-YYYY HH:mm:ss') as string) || ''
      : '',
    isRead: status === true || status === 1 || status === '1',
    link: url || undefined,
    message: message ?? '',
    raw: item,
    title: title ?? $t('page.sms.notification.personalPage.defaultTitle'),
  };
}

async function loadNotifications() {
  const response = await fetchNotificationUserList({
    current: 1,
    pageSize: 10,
  });

  const items = response.data ?? [];
  notifications.value = items.map((item) => mapNotificationItem(item));
  unreadCount.value =
    response.dataExtend?.unreadCount ??
    items[0]?.unreadCount ??
    notifications.value.filter((item) => !item.isRead).length;
}

async function safeLoadNotifications() {
  try {
    await loadNotifications();
  } catch (error) {
    console.error('Unable to load notifications.', error);
  }
}

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
  {
    handler: () => {
      openWindow(VBEN_DOC_URL, {
        target: '_blank',
      });
    },
    icon: BookOpenText,
    text: $t('ui.widgets.document'),
  },
  {
    handler: () => {
      openWindow(VBEN_GITHUB_URL, {
        target: '_blank',
      });
    },
    icon: SvgGithubIcon,
    text: 'GitHub',
  },
  {
    handler: () => {
      openWindow(`${VBEN_GITHUB_URL}/issues`, {
        target: '_blank',
      });
    },
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

const userDropdownDescription = computed(() => {
  return (
    userStore.userInfo?.email ||
    userStore.userInfo?.username ||
    userStore.userInfo?.realName ||
    ''
  );
});

const userDropdownText = computed(() => {
  return userStore.userInfo?.realName || userStore.userInfo?.username || '';
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
  unreadCount.value = 0;
}

async function markRead(id: number | string) {
  await updateNotificationStatus([String(id)], 1);
  const item = notifications.value.find((item) => item.id === id);
  if (item && !item.isRead) {
    item.isRead = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

async function handleMakeAll() {
  const unreadIds = notifications.value
    .filter((item) => !item.isRead)
    .map((item) => String(item.id));

  if (unreadIds.length > 0) {
    await updateNotificationStatus(unreadIds, 1);
  }

  notifications.value.forEach((item) => (item.isRead = true));
  unreadCount.value = 0;
}

const viewAll = () => {
  router.push('/sms/user-notifications');
};

const handleClick = (item: NotificationItem) => {
  if (item.link) {
    navigateTo(item.link, item.query, item.state);
  }
};

function navigateTo(
  link: string,
  query?: Record<string, any>,
  state?: Record<string, any>,
) {
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank');
  } else {
    router.push({
      path: link,
      query: query || {},
      state,
    });
  }
}

function getRealtimeNotificationId(
  item: SmsNotificationApi.NotificationHubItem,
) {
  return getHubNotificationValue<string>(item, 'id', 'Id') ?? null;
}

function showRealtimeBrowserNotification(
  item: SmsNotificationApi.NotificationHubItem,
) {
  const notification = mapNotificationItem(item);
  const icon = getHubNotificationValue<null | string>(item, 'icon', 'Icon');

  showBrowserNotification(notification.title, {
    body: notification.message,
    icon: icon || undefined,
    onClick(browserNotification) {
      window.focus();
      if (notification.link) {
        navigateTo(notification.link, notification.query, notification.state);
      }
      browserNotification.close();
    },
    tag: String(notification.id),
  });
}

function addRealtimeNotification(
  item: SmsNotificationApi.NotificationHubItem,
  incrementUnread = true,
) {
  const notification = mapNotificationItem(item);
  const existingIndex = notifications.value.findIndex(
    (currentItem) => currentItem.id === notification.id,
  );

  if (existingIndex !== -1) {
    const existingItem = notifications.value[existingIndex];
    if (existingItem) {
      notification.isRead = existingItem.isRead;
    }
    notifications.value.splice(existingIndex, 1);
  } else if (incrementUnread) {
    unreadCount.value += 1;
  }

  notifications.value.unshift(notification);
  notifications.value = notifications.value.slice(0, 10);

  return existingIndex === -1;
}

function updateRealtimeNotificationStatus(
  item: SmsNotificationApi.NotificationHubItem,
) {
  const id = getRealtimeNotificationId(item);
  if (!id) {
    return;
  }

  const notification = notifications.value.find(
    (currentItem) => String(currentItem.id) === id,
  );
  if (!notification) {
    return;
  }

  const status = getHubNotificationValue<boolean | null | number | string>(
    item,
    'status',
    'Status',
  );
  const isRead = status === true || status === 1 || status === '1';

  if (notification.isRead === isRead) {
    return;
  }

  notification.isRead = isRead;
  unreadCount.value = Math.max(0, unreadCount.value + (isRead ? -1 : 1));
}

function deleteRealtimeNotification(
  item: SmsNotificationApi.NotificationHubItem,
) {
  const id = getRealtimeNotificationId(item);
  if (!id) {
    return;
  }

  const existingItem = notifications.value.find(
    (notification) => String(notification.id) === id,
  );
  notifications.value = notifications.value.filter(
    (notification) => String(notification.id) !== id,
  );

  if (existingItem && !existingItem.isRead) {
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
}

onMounted(() => {
  void safeLoadNotifications();
  void realtimeStore.start().catch((error) => {
    console.error('Unable to start realtime connection.', error);
  });
  cleanupNotificationPermissionRequest =
    requestBrowserNotificationPermissionOnInteraction();
});

onBeforeUnmount(() => {
  cleanupNotificationPermissionRequest?.();
  cleanupNotificationPermissionRequest = null;
  void realtimeStore.stop().catch((error) => {
    console.error('Unable to stop realtime connection.', error);
  });
});

watch(
  () => realtimeStore.revisions[REALTIME_MESSAGE_TYPE.NOTIFICATION] ?? 0,
  (revision, previousRevision) => {
    if (revision <= previousRevision) {
      return;
    }

    const realtimeEvent = realtimeStore.latestEvent;
    if (
      !realtimeEvent ||
      realtimeEvent.type !== REALTIME_MESSAGE_TYPE.NOTIFICATION
    ) {
      return;
    }

    const action = realtimeEvent.event;
    const notification =
      realtimeEvent.data as null | SmsNotificationApi.NotificationHubItem;

    if (notification === null || notification === undefined) {
      return;
    }

    switch (action) {
      case NOTIFICATION_REALTIME_EVENT.DELETED: {
        deleteRealtimeNotification(notification);
        break;
      }
      case NOTIFICATION_REALTIME_EVENT.NEW: {
        const isNewNotification = addRealtimeNotification(notification);
        if (isNewNotification) {
          showRealtimeBrowserNotification(notification);
        }
        break;
      }
      case NOTIFICATION_REALTIME_EVENT.STATUS: {
        updateRealtimeNotificationStatus(notification);
        break;
      }
    }
  },
);

watch(
  () => realtimeStore.status,
  (status, previousStatus) => {
    if (status === 'connected' && previousStatus === 'reconnecting') {
      void safeLoadNotifications();
    }
  },
);

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :description="userDropdownDescription"
        :text="userDropdownText"
        tag-text="Pro"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :count="unreadCount"
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
        @on-click="handleClick"
        @view-all="viewAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
