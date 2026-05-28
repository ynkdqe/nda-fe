<script setup lang="ts">
import type { SmsNotificationApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';
import { formatDate } from '@vben/utils';

import {
  NButton,
  NCard,
  NCheckbox,
  NDatePicker,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NList,
  NListItem,
  NPagination,
  NPopconfirm,
  NSelect,
  NSkeleton,
  NSpace,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  deleteNotification,
  deleteNotifications,
  fetchNotificationList,
  updateNotificationStatus,
} from '#/api';

import NotificationListItem from './components/NotificationListItem.vue';

type UiNotification = {
  avatar?: string;
  date: string;
  id: string;
  isRead: boolean;
  message: string;
  raw: SmsNotificationApi.NotificationUserItem;
  senderName?: null | string;
  title: string;
};

const { t } = useI18n();

const list = ref<UiNotification[]>([]);
const loading = ref(false);
const total = ref(0);
const selectedIds = ref<Set<string>>(new Set());
const searchCollapsed = ref(true);
const query = reactive({
  dateRange: null as [number, number] | null,
  keyword: '',
  page: 1,
  pageSize: 20,
  status: undefined as number | string | undefined,
});

function mapToUiItem(item: SmsNotificationApi.NotificationUserItem) {
  return {
    avatar: item.icon || undefined,
    date: item.creationTime
      ? (formatDate(item.creationTime, 'DD-MM-YYYY HH:mm:ss') as string) || ''
      : '',
    id: item.id ?? crypto.randomUUID?.() ?? String(Math.random()),
    isRead: item.status === 1,
    message: item.message ?? '',
    raw: item,
    senderName: item.senderName,
    title: item.title ?? t('page.sms.notification.personalPage.defaultTitle'),
  } satisfies UiNotification;
}

function getDateParams() {
  if (!query.dateRange?.[0] || !query.dateRange?.[1]) {
    return {} as { endDate?: string; startDate?: string };
  }

  const [start, end] = query.dateRange;
  return {
    endDate: new Date(end).toISOString(),
    startDate: new Date(start).toISOString(),
  };
}

async function loadData() {
  loading.value = true;
  try {
    const response = await fetchNotificationList({
      keyword: query.keyword?.trim() || undefined,
      page: query.page,
      pageSize: query.pageSize,
      status: query.status === '' ? undefined : query.status,
      ...getDateParams(),
    });

    total.value = response.total ?? 0;
    list.value = (response.data ?? response.items ?? []).map((item) =>
      mapToUiItem(item),
    );
  } catch (error: any) {
    message.error(
      error?.message || t('page.sms.notification.personalPage.loadError'),
    );
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.dateRange = null;
  query.keyword = '';
  query.page = 1;
  query.pageSize = 20;
  query.status = undefined;
  loadData();
}

onMounted(() => {
  loadData();
});

function handlePageChange(page: number, pageSize?: number) {
  query.page = page;
  if (pageSize) {
    query.pageSize = pageSize;
  }
  loadData();
}

function toggleSelect(id: string, checked: boolean) {
  const next = new Set(selectedIds.value);
  if (checked) {
    next.add(id);
  } else {
    next.delete(id);
  }
  selectedIds.value = next;
}

const hasSelection = computed(() => selectedIds.value.size > 0);

const allSelected = computed({
  get() {
    return (
      list.value.length > 0 &&
      list.value.every((item) => selectedIds.value.has(item.id))
    );
  },
  set(value: boolean) {
    selectedIds.value = value
      ? new Set(list.value.map((item) => item.id))
      : new Set();
  },
});

async function handleToggleRead(item: UiNotification) {
  try {
    const toStatus = item.isRead ? 0 : 1;
    await updateNotificationStatus([item.id], toStatus as 0 | 1);
    item.isRead = !item.isRead;
    message.success(
      item.isRead
        ? t('page.sms.notification.personalPage.markReadSuccess')
        : t('page.sms.notification.personalPage.markUnreadSuccess'),
    );
  } catch (error: any) {
    message.error(
      error?.message ||
        t('page.sms.notification.personalPage.updateStatusError'),
    );
  }
}

async function handleDeleteOne(item: UiNotification) {
  try {
    await deleteNotification(item.id);
    list.value = list.value.filter(
      (notification) => notification.id !== item.id,
    );
    total.value = Math.max(0, total.value - 1);
    toggleSelect(item.id, false);
    message.success(t('page.sms.notification.personalPage.deleteSuccess'));
  } catch (error: any) {
    message.error(
      error?.message || t('page.sms.notification.personalPage.deleteError'),
    );
  }
}

async function handleDeleteSelected() {
  const ids = [...selectedIds.value];
  if (ids.length === 0) {
    return;
  }

  try {
    await deleteNotifications(ids);
    list.value = list.value.filter((item) => !selectedIds.value.has(item.id));
    total.value = Math.max(0, total.value - ids.length);
    selectedIds.value = new Set();
    message.success(
      t('page.sms.notification.personalPage.deleteSelectedSuccess'),
    );
  } catch (error: any) {
    message.error(
      error?.message ||
        t('page.sms.notification.personalPage.deleteSelectedError'),
    );
  }
}

async function handleMarkSelected(status: 0 | 1) {
  const ids = [...selectedIds.value];
  if (ids.length === 0) {
    return;
  }

  try {
    await updateNotificationStatus(ids, status);
    list.value = list.value.map((notification) =>
      selectedIds.value.has(notification.id)
        ? { ...notification, isRead: status === 1 }
        : notification,
    );
    message.success(
      status === 1
        ? t('page.sms.notification.personalPage.markReadSuccess')
        : t('page.sms.notification.personalPage.markUnreadSuccess'),
    );
  } catch (error: any) {
    message.error(
      error?.message ||
        t('page.sms.notification.personalPage.updateStatusError'),
    );
  }
}
</script>

<template>
  <Page>
    <div class="space-y-4">
      <NCard :bordered="false" class="shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="font-semibold">
            {{ t('page.sms.notification.personalPage.filter.title') }}
          </div>
          <NButton
            text
            type="primary"
            @click="searchCollapsed = !searchCollapsed"
          >
            {{
              searchCollapsed
                ? t('page.sms.notification.personalPage.filter.expand')
                : t('page.sms.notification.personalPage.filter.collapse')
            }}
          </NButton>
        </div>

        <div v-show="!searchCollapsed" class="mt-4">
          <NForm inline label-placement="left" @submit.prevent>
            <NFormItem
              :label="t('page.sms.notification.personalPage.filter.keyword')"
            >
              <NInput
                v-model:value="query.keyword"
                clearable
                :placeholder="
                  t(
                    'page.sms.notification.personalPage.filter.keywordPlaceholder',
                  )
                "
                style="min-width: 260px"
                @keyup.enter="handleSearch"
              />
            </NFormItem>

            <NFormItem
              :label="t('page.sms.notification.personalPage.filter.status')"
            >
              <NSelect
                v-model:value="query.status"
                clearable
                :options="[
                  {
                    label: t(
                      'page.sms.notification.personalPage.filter.unread',
                    ),
                    value: 0,
                  },
                  {
                    label: t('page.sms.notification.personalPage.filter.read'),
                    value: 1,
                  },
                ]"
                :placeholder="
                  t(
                    'page.sms.notification.personalPage.filter.statusPlaceholder',
                  )
                "
                style="width: 180px"
              />
            </NFormItem>

            <NFormItem
              :label="t('page.sms.notification.personalPage.filter.dateRange')"
            >
              <NDatePicker
                v-model:value="query.dateRange"
                clearable
                format="dd-MM-yyyy HH:mm:ss"
                type="datetimerange"
                style="min-width: 320px"
              />
            </NFormItem>

            <NFormItem>
              <NSpace>
                <NButton type="primary" @click="handleSearch">
                  {{ t('page.sms.notification.personalPage.filter.search') }}
                </NButton>
                <NButton @click="handleReset">
                  {{ t('page.sms.notification.personalPage.filter.reset') }}
                </NButton>
              </NSpace>
            </NFormItem>
          </NForm>
        </div>
      </NCard>

      <NCard :bordered="false" class="shadow-sm">
        <NSkeleton v-if="loading" text :repeat="4" />

        <template v-else>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <NCheckbox v-model:checked="allSelected">
                {{
                  t('page.sms.notification.personalPage.selection.selectAll')
                }}
              </NCheckbox>
              <strong>
                {{ t('page.sms.notification.personalPage.selection.total') }}
              </strong>
              <span>{{ total }}</span>
              <span v-if="hasSelection">
                {{
                  t('page.sms.notification.personalPage.selection.selected', {
                    count: selectedIds.size,
                  })
                }}
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              <NButton
                :disabled="!hasSelection"
                @click="() => handleMarkSelected(1)"
              >
                {{
                  t('page.sms.notification.personalPage.actions.markAllRead')
                }}
              </NButton>

              <NPopconfirm
                v-if="hasSelection"
                :negative-text="t('page.common.cancel')"
                :positive-text="
                  t('page.sms.notification.personalPage.actions.delete')
                "
                @positive-click="handleDeleteSelected"
              >
                <template #trigger>
                  <NButton type="error">
                    {{
                      t(
                        'page.sms.notification.personalPage.actions.deleteSelected',
                      )
                    }}
                  </NButton>
                </template>
                {{
                  t(
                    'page.sms.notification.personalPage.actions.deleteSelectedConfirm',
                  )
                }}
              </NPopconfirm>
            </div>
          </div>

          <NList bordered>
            <NListItem v-for="item in list" :key="item.id">
              <div class="flex w-full gap-3">
                <div class="pt-1.5">
                  <NCheckbox
                    :checked="selectedIds.has(item.id)"
                    @update:checked="
                      (checked) => toggleSelect(item.id, checked)
                    "
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <NotificationListItem
                    :avatar="item.avatar"
                    :date="item.date"
                    :is-read="item.isRead"
                    :message="item.message"
                    :sender-name="item.senderName"
                    :title="item.title"
                    @delete="() => handleDeleteOne(item)"
                    @toggle-read="() => handleToggleRead(item)"
                  />
                </div>
              </div>
            </NListItem>
          </NList>

          <NEmpty
            v-if="list.length === 0"
            class="py-8"
            :description="t('page.sms.notification.personalPage.empty')"
          />

          <div class="mt-3 flex justify-end">
            <NPagination
              v-model:page="query.page"
              v-model:page-size="query.pageSize"
              show-size-picker
              :item-count="total"
              :page-sizes="[10, 20, 50, 100]"
              @update:page="(page) => handlePageChange(page)"
              @update:page-size="(pageSize) => handlePageChange(1, pageSize)"
            />
          </div>
        </template>
      </NCard>
    </div>
  </Page>
</template>
