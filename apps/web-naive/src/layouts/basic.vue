<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, onMounted, ref, watch } from 'vue';
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
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();
const showDot = computed(() => unreadCount.value > 0);

function mapNotificationItem(item: any): NotificationItem {
  const id = item.id ?? crypto.randomUUID?.() ?? String(Math.random());
  return {
    id,
    avatar: item.icon || `https://avatar.vercel.sh/${encodeURIComponent(id)}`,
    date: item.creationTime
      ? (formatDate(item.creationTime, 'DD-MM-YYYY HH:mm:ss') as string) || ''
      : '',
    isRead: item.status === 1,
    link: item.url || undefined,
    message: item.message ?? '',
    raw: item,
    title: item.title ?? $t('page.sms.notification.personalPage.defaultTitle'),
  };
}

async function loadNotifications() {
  const response = await fetchNotificationUserList({
    current: 1,
    pageSize: 10,
  });

  const items = response.data ?? response.items ?? [];
  notifications.value = items.map((item) => mapNotificationItem(item));
  unreadCount.value =
    response.dataExtend?.unreadCount ??
    items[0]?.unreadCount ??
    notifications.value.filter((item) => !item.isRead).length;
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

onMounted(() => {
  loadNotifications();
});

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
