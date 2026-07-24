<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SettingsApi } from '#/models/settings';

import { Page } from '@vben/common-ui';

import { NTag, NTooltip } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSettingsApi } from '#/api';
import { $t } from '#/locales';

const DEFAULT_PAGE_SIZE = 50;

function normalizeFormValues(formValues?: Record<string, any>) {
  const filter = formValues?.filter?.trim?.();

  return {
    ...(filter ? { filter } : {}),
  };
}

function formatValue(value?: null | string) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: {
    content: $t('page.system.settingsPage.reset'),
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: $t('page.system.settingsPage.filterPlaceholder'),
      },
      fieldName: 'filter',
      label: $t('page.system.settingsPage.filter'),
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: {
    content: $t('page.system.settingsPage.search'),
  },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<SettingsApi.SettingItem> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'name',
      fixed: 'left',
      minWidth: 300,
      title: $t('page.system.settingsPage.name'),
    },
    {
      field: 'value',
      minWidth: 280,
      slots: { default: 'valueCell' },
      title: $t('page.system.settingsPage.value'),
    },
    {
      field: 'defaultValue',
      minWidth: 240,
      slots: { default: 'defaultValueCell' },
      title: $t('page.system.settingsPage.defaultValue'),
    },
    {
      field: 'displayName',
      minWidth: 260,
      title: $t('page.system.settingsPage.displayName'),
    },
    {
      field: 'description',
      minWidth: 260,
      title: $t('page.system.settingsPage.descriptionColumn'),
    },
    {
      align: 'center',
      field: 'isVisibleToClients',
      slots: { default: 'booleanCell' },
      title: $t('page.system.settingsPage.visibleToClients'),
      width: 150,
    },
    {
      align: 'center',
      field: 'isSensitive',
      slots: { default: 'booleanCell' },
      title: $t('page.system.settingsPage.sensitive'),
      width: 120,
    },
    {
      align: 'center',
      field: 'isEncrypted',
      slots: { default: 'booleanCell' },
      title: $t('page.system.settingsPage.encrypted'),
      width: 120,
    },
    {
      field: 'providers',
      minWidth: 180,
      slots: { default: 'providersCell' },
      title: $t('page.system.settingsPage.providers'),
    },
  ],
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await getSettingsApi({
          current: page.currentPage ?? 1,
          pageSize: page.pageSize ?? DEFAULT_PAGE_SIZE,
          ...normalizeFormValues(formValues),
        });
        const items = response.data ?? [];

        return {
          items,
          total: response.total ?? items.length,
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
    refresh: true,
  },
};

const [Grid] = useVbenVxeGrid<SettingsApi.SettingItem>({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Page
    :description="$t('page.system.settingsPage.description')"
    :title="$t('page.system.settings')"
  >
    <Grid>
      <template #valueCell="{ row }">
        <NTooltip v-if="row.value" trigger="hover">
          <template #trigger>
            <span class="block max-w-full truncate font-mono text-xs">
              {{ formatValue(row.value) }}
            </span>
          </template>
          <span class="max-w-xl break-all whitespace-pre-wrap">
            {{ row.value }}
          </span>
        </NTooltip>
        <span v-else>-</span>
      </template>

      <template #defaultValueCell="{ row }">
        <NTooltip v-if="row.defaultValue" trigger="hover">
          <template #trigger>
            <span class="block max-w-full truncate font-mono text-xs">
              {{ formatValue(row.defaultValue) }}
            </span>
          </template>
          <span class="max-w-xl break-all whitespace-pre-wrap">
            {{ row.defaultValue }}
          </span>
        </NTooltip>
        <span v-else>-</span>
      </template>

      <template #booleanCell="{ cellValue }">
        <NTag
          :bordered="false"
          size="small"
          :type="cellValue ? 'success' : 'default'"
        >
          {{
            cellValue
              ? $t('page.system.settingsPage.yes')
              : $t('page.system.settingsPage.no')
          }}
        </NTag>
      </template>

      <template #providersCell="{ row }">
        <span v-if="!row.providers?.length">-</span>
        <NTooltip v-else trigger="hover">
          <template #trigger>
            <NTag :bordered="false" size="small" type="info">
              {{ row.providers.length }}
            </NTag>
          </template>
          <pre class="max-w-xl whitespace-pre-wrap break-all text-xs">{{
            JSON.stringify(row.providers, null, 2)
          }}</pre>
        </NTooltip>
      </template>
    </Grid>
  </Page>
</template>
