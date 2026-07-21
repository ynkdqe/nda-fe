<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SmsMessageApi } from '#/models/sms';

import { onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales';
import { formatDate } from '@vben/utils';

import { NButton, NTag } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchSmsMessageList,
  fetchSmsProviderList,
  fetchSmsTemplateList,
} from '#/api';

import SendSmsForm from './components/SendSmsForm.vue';

const { t } = useI18n();
const sendFormVisible = ref(false);

const providerOptions = ref<Array<{ label: string; value: string }>>([]);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);

const providerMap = ref<Record<string, string>>({});
const templateMap = ref<Record<string, string>>({});

function normalizeList<T>(response: SmsMessageApi.ListResult<T>) {
  return response.data ?? [];
}

async function loadProviders() {
  try {
    const res = await fetchSmsProviderList({ current: 1, pageSize: 1000 });
    const optionEntries = normalizeList(res).map(
      (provider: SmsMessageApi.SmsProvider) =>
        [String(provider.id), provider.name || String(provider.id)] as const,
    );

    providerMap.value = Object.fromEntries(optionEntries);
    providerOptions.value = optionEntries.map(([value, label]) => ({
      label,
      value,
    }));
  } catch (error) {
    console.warn('Failed to load providers', error);
    providerMap.value = {};
    providerOptions.value = [];
  }
}

async function loadTemplates() {
  try {
    const res = await fetchSmsTemplateList({ current: 1, pageSize: 1000 });
    const optionEntries = normalizeList(res).map(
      (template: SmsMessageApi.SmsTemplate) =>
        [String(template.id), template.name || String(template.id)] as const,
    );

    templateMap.value = Object.fromEntries(optionEntries);
    templateOptions.value = optionEntries.map(([value, label]) => ({
      label,
      value,
    }));
  } catch (error) {
    console.warn('Failed to load templates', error);
    templateMap.value = {};
    templateOptions.value = [];
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: { content: 'Đặt lại' },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập mã yêu cầu, số điện thoại hoặc nội dung',
      },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: 'Thành công', value: '1' },
          { label: 'Thất bại', value: '0' },
        ],
        placeholder: 'Tất cả',
      },
      fieldName: 'status',
      label: 'Trạng thái',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
        placeholder: 'Tất cả',
      },
      fieldName: 'smsProviderId',
      label: 'Nhà cung cấp',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
        placeholder: 'Tất cả',
      },
      fieldName: 'smsTemplateId',
      label: 'Mẫu tin nhắn',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<SmsMessageApi.SmsMessage> = {
  border: 'full',
  columns: [
    { field: 'id', title: '#', width: 80 },
    {
      field: 'requestId',
      showOverflow: 'tooltip',
      title: 'Mã yêu cầu',
      width: 260,
    },
    {
      field: 'smsProviderId',
      slots: { default: 'providerCell' },
      title: 'Nhà cung cấp',
      width: 160,
    },
    {
      field: 'smsTemplateId',
      slots: { default: 'templateCell' },
      title: 'Mẫu tin nhắn',
      width: 160,
    },
    { field: 'phoneNumber', title: 'Số điện thoại', width: 140 },
    {
      field: 'message',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: 'Nội dung',
    },
    {
      field: 'status',
      slots: { default: 'statusCell' },
      title: 'Trạng thái',
      width: 140,
    },
    {
      field: 'sendedTime',
      slots: { default: 'sendedCell' },
      title: 'Thời gian gửi',
      width: 180,
    },
    {
      field: 'creationTime',
      slots: { default: 'creationCell' },
      title: 'Ngày tạo',
      width: 180,
    },
  ],
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await fetchSmsMessageList({
          keyword: formValues.keyword?.trim?.() || undefined,
          current: page.currentPage,
          pageSize: page.pageSize,
          smsProviderId: formValues.smsProviderId || undefined,
          smsTemplateId: formValues.smsTemplateId || undefined,
          status: formValues.status || undefined,
        });

        return {
          items: response.data ?? [],
          total: response.total ?? 0,
        };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: true,
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<SmsMessageApi.SmsMessage>({
  formOptions,
  gridOptions,
});

function syncFormSelectOptions() {
  const current = gridApi.formApi.getState?.();
  const nextSchema = (current?.schema || []).map((item: any) => {
    if (item.fieldName === 'smsProviderId') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: providerOptions.value,
        },
      };
    }

    if (item.fieldName === 'smsTemplateId') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: templateOptions.value,
        },
      };
    }

    return item;
  });

  gridApi.formApi.setState?.({ schema: nextSchema });
}

watch([providerOptions, templateOptions], () => syncFormSelectOptions());

onMounted(() => {
  loadProviders();
  loadTemplates();
  syncFormSelectOptions();
});

function isSuccessStatus(status: SmsMessageApi.SmsMessage['status']) {
  if (typeof status === 'boolean') {
    return status;
  }

  const value = String(status ?? '').toLowerCase();
  if (!value) {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  const num = Number(value);
  return !Number.isNaN(num) && num === 1;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '';
  }

  return formatDate(value, 'DD-MM-YYYY HH:mm:ss');
}

function handleSent() {
  gridApi.query();
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="sendFormVisible = true">
          <template #icon>
            <IconifyIcon icon="lucide:send" />
          </template>
          {{ t('page.sms.messagePage.actions.send') }}
        </NButton>
      </template>

      <template #providerCell="{ row }">
        {{ providerMap[String(row.smsProviderId)] || row.smsProviderId || '-' }}
      </template>

      <template #templateCell="{ row }">
        {{ templateMap[String(row.smsTemplateId)] || row.smsTemplateId || '-' }}
      </template>

      <template #statusCell="{ row }">
        <NTag
          :bordered="false"
          :type="isSuccessStatus(row.status) ? 'success' : 'default'"
        >
          {{ isSuccessStatus(row.status) ? 'Thành công' : 'Thất bại' }}
        </NTag>
      </template>

      <template #sendedCell="{ row }">
        {{ formatDateTime(row.sendedTime) }}
      </template>

      <template #creationCell="{ row }">
        {{ formatDateTime(row.creationTime) }}
      </template>
    </Grid>

    <SendSmsForm
      :visible="sendFormVisible"
      @sent="handleSent"
      @update:visible="(value) => (sendFormVisible = value)"
    />
  </Page>
</template>
