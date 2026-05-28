<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SmsNotificationApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';
import { formatDate } from '@vben/utils';

import { NButton, NDataTable, NInput, NModal, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createNotification, fetchAdminNotificationList } from '#/api';

import AdminNotificationForm from './components/AdminNotificationForm.vue';

const { t } = useI18n();

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: {
    content: t('page.sms.notification.administrationPage.filter.reset'),
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: t(
          'page.sms.notification.administrationPage.filter.keywordPlaceholder',
        ),
      },
      fieldName: 'keyword',
      label: t('page.sms.notification.administrationPage.filter.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            label: t('page.sms.notification.administrationPage.filter.private'),
            value: '0',
          },
          {
            label: t('page.sms.notification.administrationPage.filter.public'),
            value: '1',
          },
        ],
        placeholder: t(
          'page.sms.notification.administrationPage.filter.statusPlaceholder',
        ),
      },
      fieldName: 'status',
      label: t('page.sms.notification.administrationPage.filter.status'),
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: t('page.sms.notification.administrationPage.filter.search'),
  },
  submitOnChange: false,
  submitOnEnter: true,
};

const toolbarConfig = {
  custom: true,
  export: true,
  search: true,
} as VxeGridProps<SmsNotificationApi.NotificationItem>['toolbarConfig'];

const gridOptions: VxeGridProps<SmsNotificationApi.NotificationItem> = {
  border: 'full',
  columns: [
    {
      title: '#',
      type: 'seq',
      width: 70,
    },
    {
      field: 'title',
      minWidth: 240,
      showOverflow: 'tooltip',
      title: t('page.sms.notification.administrationPage.table.title'),
    },
    {
      field: 'type',
      slots: { default: 'typeCell' },
      title: t('page.sms.notification.administrationPage.table.type'),
      width: 160,
    },
    {
      field: 'senderName',
      title: t('page.sms.notification.administrationPage.table.sender'),
      width: 180,
    },
    {
      field: 'notificationReceivers',
      minWidth: 220,
      slots: { default: 'recipientsCell' },
      title: t('page.sms.notification.administrationPage.table.recipients'),
    },
    {
      field: 'creationTime',
      slots: { default: 'creationCell' },
      title: t('page.sms.notification.administrationPage.table.creationTime'),
      width: 200,
    },
  ],
  keepSource: true,
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await fetchAdminNotificationList({
          keyword: formValues.keyword?.trim?.() || undefined,
          page: page.currentPage,
          pageSize: page.pageSize,
          status: formValues.status || undefined,
        });

        return {
          items: response.data ?? response.items ?? [],
          total: response.total ?? 0,
        };
      },
    },
  },
  stripe: true,
  toolbarConfig,
};

const [Grid, gridApi] = useVbenVxeGrid<SmsNotificationApi.NotificationItem>({
  formOptions,
  gridOptions,
});

type NotificationType = 0 | 1;
const sendVisible = ref(false);
const sendSubmitting = ref(false);
const sendFormRef = ref();
const sendForm = reactive({
  icon: '',
  isSystem: false,
  message: '',
  recipientIds: [] as string[],
  senderId: undefined as string | undefined,
  title: '',
  type: 0 as NotificationType,
  url: '',
});

function resetSendForm() {
  sendForm.icon = '';
  sendForm.isSystem = false;
  sendForm.message = '';
  sendForm.recipientIds = [];
  sendForm.senderId = undefined;
  sendForm.title = '';
  sendForm.type = 0;
  sendForm.url = '';
}

function openSendModal() {
  resetSendForm();
  sendVisible.value = true;
}

function closeSendModal() {
  sendVisible.value = false;
}

async function handleSend() {
  try {
    sendSubmitting.value = true;
    await sendFormRef.value?.validate?.();
    const response = await createNotification({
      icon: sendForm.icon || null,
      isSystem: !!sendForm.isSystem,
      message: sendForm.message,
      receiverIds: Array.isArray(sendForm.recipientIds)
        ? sendForm.recipientIds
        : [],
      senderId: sendForm.senderId || null,
      title: sendForm.title,
      type: sendForm.type,
      url: sendForm.url || null,
    });

    if ((response as any)?.success === false) {
      throw new Error(
        (response as any)?.message ||
          t('page.sms.notification.administrationPage.sendFailed'),
      );
    }

    message.success(
      (response as any)?.message ||
        t('page.sms.notification.administrationPage.sendSuccess'),
    );
    closeSendModal();
    await gridApi.query();
  } catch (error: any) {
    if (error?.message) {
      message.error(error.message);
    }
  } finally {
    sendSubmitting.value = false;
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return '';
  }

  return formatDate(value, 'DD-MM-YYYY HH:mm:ss');
}

const recipientsVisible = ref(false);
const recipientsQuery = ref('');
const recipientsData = ref<SmsNotificationApi.NotificationReceiver[]>([]);

function getReceivers(row: SmsNotificationApi.NotificationItem) {
  return Array.isArray(row.notificationReceivers)
    ? row.notificationReceivers
    : [];
}

function openRecipientsModal(row: SmsNotificationApi.NotificationItem) {
  recipientsData.value = getReceivers(row).map((receiver) => ({
    email: receiver.email,
    id: receiver.id ?? receiver.userId,
    name: receiver.name,
    readAt: receiver.readAt ?? null,
    status: receiver.status ?? (receiver.readAt ? 'read' : 'unread'),
    userId: receiver.userId,
    userName: receiver.userName,
  }));
  recipientsVisible.value = true;
}

function closeRecipientsModal() {
  recipientsVisible.value = false;
}

const filteredRecipients = computed(() => {
  const keyword = recipientsQuery.value.trim().toLowerCase();
  if (!keyword) {
    return recipientsData.value;
  }

  return recipientsData.value.filter((receiver) => {
    const name = (receiver.name || '').toLowerCase();
    const userName = (receiver.userName || '').toLowerCase();
    const email = (receiver.email || '').toLowerCase();
    return (
      name.includes(keyword) ||
      userName.includes(keyword) ||
      email.includes(keyword)
    );
  });
});

const recipientsColumns = computed(() => [
  {
    key: 'name',
    title: t('page.sms.notification.administrationPage.recipients.fullName'),
    width: 220,
  },
  {
    key: 'userName',
    title: t('page.sms.notification.administrationPage.recipients.account'),
    width: 160,
  },
  {
    key: 'status',
    title: t('page.sms.notification.administrationPage.recipients.status'),
    width: 120,
  },
  {
    key: 'readAt',
    title: t('page.sms.notification.administrationPage.recipients.viewedAt'),
    width: 180,
  },
]);
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="openSendModal">
          {{ t('page.sms.notification.administrationPage.actions.send') }}
        </NButton>
      </template>

      <template #typeCell="{ row }">
        <NTag :bordered="false" :type="row.type === 1 ? 'info' : 'success'">
          {{
            row.type === 1
              ? t('page.sms.notification.administrationPage.table.public')
              : t('page.sms.notification.administrationPage.table.private')
          }}
        </NTag>
      </template>

      <template #recipientsCell="{ row }">
        <div v-if="row.type === 1" class="font-medium text-blue-600">
          {{
            t('page.sms.notification.administrationPage.recipients.allUsers')
          }}
        </div>
        <div
          v-else-if="getReceivers(row).length > 0"
          class="whitespace-normal break-words text-sm"
        >
          <template v-if="getReceivers(row).length === 1">
            {{ getReceivers(row)[0]?.name }} (
            {{ getReceivers(row)[0]?.userName }} )
          </template>
          <template v-else>
            <a
              class="mt-1 block text-xs text-blue-600 hover:underline md:ml-1 md:inline"
              @click.prevent="openRecipientsModal(row)"
            >
              {{
                t('page.sms.notification.administrationPage.recipients.view', {
                  count: getReceivers(row).length,
                })
              }}
            </a>
          </template>
        </div>
        <div v-else class="text-gray-400">
          {{ t('page.sms.notification.administrationPage.recipients.empty') }}
        </div>
      </template>

      <template #creationCell="{ row }">
        {{ formatDateTime(row.creationTime) }}
      </template>
    </Grid>

    <NModal
      v-model:show="sendVisible"
      preset="dialog"
      :title="t('page.sms.notification.administrationPage.modal.title')"
      :positive-text="t('page.sms.notification.administrationPage.modal.ok')"
      :negative-text="t('page.common.cancel')"
      :loading="sendSubmitting"
      style="width: 720px"
      @positive-click="handleSend"
      @negative-click="closeSendModal"
      @close="closeSendModal"
    >
      <AdminNotificationForm
        ref="sendFormRef"
        :model-value="sendForm"
        @update:model-value="(value) => Object.assign(sendForm, value)"
      />
    </NModal>

    <NModal
      v-model:show="recipientsVisible"
      preset="card"
      :title="t('page.sms.notification.administrationPage.recipients.title')"
      style="width: 720px"
      @close="closeRecipientsModal"
    >
      <NInput
        v-model:value="recipientsQuery"
        clearable
        :placeholder="
          t(
            'page.sms.notification.administrationPage.recipients.searchPlaceholder',
          )
        "
        class="mb-3"
      />

      <NDataTable
        :columns="recipientsColumns"
        :data="filteredRecipients"
        :pagination="{ pageSize: 10 }"
        row-key="userId"
        size="small"
      >
        <template #bodyCell="{ column, row }">
          <template v-if="column.key === 'status'">
            <NTag :bordered="false" :type="row?.readAt ? 'success' : 'default'">
              {{
                row?.readAt
                  ? t(
                      'page.sms.notification.administrationPage.recipients.read',
                    )
                  : t(
                      'page.sms.notification.administrationPage.recipients.unread',
                    )
              }}
            </NTag>
          </template>
          <template v-else-if="column.key === 'readAt'">
            {{ row?.readAt ? formatDateTime(row.readAt) : '-' }}
          </template>
        </template>
      </NDataTable>
    </NModal>
  </Page>
</template>
