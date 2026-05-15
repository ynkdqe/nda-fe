<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SmsMessageApi } from '#/models/sms';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useI18n } from '@vben/locales';
import { formatDate } from '@vben/utils';

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchSmsProviderList } from '#/api';

const { t } = useI18n();

function handleAdd() {
  message.info(t('page.sms.templatePage.action.notImplemented'));
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: {
    content: t('page.sms.providerPage.search.reset'),
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: t('page.sms.providerPage.search.keywordPlaceholder'),
      },
      fieldName: 'keyword',
      label: t('page.sms.providerPage.search.keywordLabel'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          {
            label: t('page.sms.providerPage.search.status.active'),
            value: '1',
          },
          {
            label: t('page.sms.providerPage.search.status.inactive'),
            value: '0',
          },
        ],
        placeholder: t('page.sms.providerPage.search.allPlaceholder'),
      },
      fieldName: 'status',
      label: t('page.sms.providerPage.search.statusLabel'),
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: t('page.sms.providerPage.search.submit'),
  },
  submitOnChange: false,
  submitOnEnter: true,
};

const toolbarConfig = {
  custom: true,
  export: true,
  search: true,
} as VxeGridProps<SmsMessageApi.SmsProvider>['toolbarConfig'];

const gridOptions: VxeGridProps<SmsMessageApi.SmsProvider> = {
  border: 'full',
  columns: [
    {
      field: 'id',
      title: '#',
      width: 80,
    },
    {
      field: 'name',
      title: t('page.sms.providerPage.table.name'),
      width: 220,
    },
    {
      field: 'providerUrl',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: t('page.sms.providerPage.table.providerUrl'),
    },
    {
      field: 'status',
      slots: { default: 'statusCell' },
      title: t('page.sms.providerPage.table.status'),
      width: 140,
    },
    {
      field: 'creationTime',
      slots: { default: 'creationCell' },
      title: t('page.sms.providerPage.table.creationTime'),
      width: 180,
    },
    {
      field: 'creatorName',
      title: t('page.sms.providerPage.table.creatorName'),
      width: 160,
    },
    {
      field: 'modificationTime',
      slots: { default: 'modificationCell' },
      title: t('page.sms.providerPage.table.modificationTime'),
      width: 180,
    },
    {
      field: 'modifierName',
      title: t('page.sms.providerPage.table.modifierName'),
      width: 160,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: t('page.sms.providerPage.table.action'),
      width: 120,
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
        const response = await fetchSmsProviderList({
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

const [Grid] = useVbenVxeGrid<SmsMessageApi.SmsProvider>({
  formOptions,
  gridOptions,
});

function handleNotImplemented() {
  message.info(t('page.sms.providerPage.action.notImplemented'));
}

function isActiveStatus(status: SmsMessageApi.SmsProvider['status']) {
  if (typeof status === 'boolean') {
    return status;
  }

  const value = String(status ?? '').toLowerCase();
  if (!value) {
    return false;
  }

  if (value === 'active' || value === 'true') {
    return true;
  }

  if (value === 'inactive' || value === 'false') {
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
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
        </NButton>
      </template>

      <template #statusCell="{ row }">
        <NTag
          :bordered="false"
          :type="isActiveStatus(row.status) ? 'success' : 'default'"
        >
          {{
            isActiveStatus(row.status)
              ? t('page.sms.providerPage.statusTag.active')
              : t('page.sms.providerPage.statusTag.inactive')
          }}
        </NTag>
      </template>

      <template #creationCell="{ row }">
        {{ formatDateTime(row.creationTime) }}
      </template>

      <template #modificationCell="{ row }">
        {{ formatDateTime(row.modificationTime) }}
      </template>

      <template #action>
        <NSpace justify="center" :size="4">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="primary"
                @click="handleNotImplemented"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:pencil" />
                </template>
              </NButton>
            </template>
            {{ t('page.sms.providerPage.action.edit') }}
          </NTooltip>

          <NPopconfirm
            :negative-text="t('page.sms.providerPage.action.deleteCancel')"
            :positive-text="t('page.sms.providerPage.action.deleteOk')"
            @positive-click="handleNotImplemented"
          >
            <template #trigger>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton circle quaternary size="small" type="error">
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                {{ t('page.sms.providerPage.action.delete') }}
              </NTooltip>
            </template>
            {{ t('page.sms.providerPage.action.deleteConfirm') }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>
  </Page>
</template>
