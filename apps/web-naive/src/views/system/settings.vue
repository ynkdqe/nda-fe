<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SettingsApi } from '#/models/settings';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NInput,
  NModal,
  NSpace,
  NTag,
  NTooltip,
} from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSettingsApi, updateSettingApi } from '#/api';
import { $t } from '#/locales';

const DEFAULT_PAGE_SIZE = 20;

function normalizeFormValues(formValues?: Record<string, any>) {
  const filter = formValues?.filter?.trim?.();

  return {
    ...(filter ? { filter } : {}),
  };
}

function formatValue(value?: null | string) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProvider(provider: unknown) {
  return isRecord(provider) ? provider : { value: provider };
}

function isTenantProvider(provider: unknown) {
  const record = normalizeProvider(provider);
  const providerName = String(
    record.providerName ??
      record.ProviderName ??
      record.name ??
      record.Name ??
      '',
  ).toLowerCase();

  return (
    providerName === 't' ||
    providerName === 'tenant' ||
    providerName.includes('tenant') ||
    Object.values(record).some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes('tenant'),
    )
  );
}

const selectedSetting = ref<null | SettingsApi.SettingItem>(null);
const tenantDetailVisible = ref(false);
const editVisible = ref(false);
const editLoading = ref(false);
const editingValue = ref('');

const tenantProviders = computed(() => {
  const providers = selectedSetting.value?.providers ?? [];
  const tenantItems = providers.filter((provider) =>
    isTenantProvider(provider),
  );

  return (tenantItems.length > 0 ? tenantItems : providers).map((provider) =>
    normalizeProvider(provider),
  );
});

function handleViewTenantDetail(row: SettingsApi.SettingItem) {
  selectedSetting.value = row;
  tenantDetailVisible.value = true;
}

function handleEdit(row: SettingsApi.SettingItem) {
  selectedSetting.value = row;
  editingValue.value = row.value ?? '';
  editVisible.value = true;
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
      fixed: 'left',
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: $t('page.system.settingsPage.actions'),
      width: 110,
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
        const params: SettingsApi.SettingListParams = {
          current: page.currentPage ?? 1,
          pageSize: page.pageSize ?? DEFAULT_PAGE_SIZE,
          ...normalizeFormValues(formValues),
        };
        const response = await getSettingsApi(params);
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

const [Grid, gridApi] = useVbenVxeGrid<SettingsApi.SettingItem>({
  formOptions,
  gridOptions,
});

async function handleSubmitEdit() {
  if (!selectedSetting.value) {
    return;
  }

  editLoading.value = true;
  try {
    await updateSettingApi({
      name: selectedSetting.value.name,
      value: editingValue.value || null,
    });
    editVisible.value = false;
    await gridApi.query();
  } finally {
    editLoading.value = false;
  }
}
</script>

<template>
  <Page
    :description="$t('page.system.settingsPage.description')"
    :title="$t('page.system.settings')"
  >
    <Grid>
      <template #actions="{ row }">
        <NSpace :size="4" justify="center">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="info"
                @click="handleViewTenantDetail(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:building-2" />
                </template>
              </NButton>
            </template>
            {{ $t('page.system.settingsPage.tenantDetail') }}
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="primary"
                @click="handleEdit(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:pencil" />
                </template>
              </NButton>
            </template>
            {{ $t('page.system.settingsPage.edit') }}
          </NTooltip>
        </NSpace>
      </template>

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

    <NModal
      v-model:show="tenantDetailVisible"
      preset="card"
      :title="$t('page.system.settingsPage.tenantDetail')"
      class="max-w-[720px]"
    >
      <NDescriptions
        v-if="selectedSetting"
        bordered
        :column="1"
        label-placement="left"
        size="small"
      >
        <NDescriptionsItem :label="$t('page.system.settingsPage.name')">
          {{ selectedSetting.name }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.system.settingsPage.providers')">
          <span v-if="tenantProviders.length === 0">-</span>
          <NSpace v-else vertical :size="8">
            <pre
              v-for="(provider, index) in tenantProviders"
              :key="index"
              class="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-3 text-xs"
              >{{ JSON.stringify(provider, null, 2) }}</pre
            >
          </NSpace>
        </NDescriptionsItem>
      </NDescriptions>
    </NModal>

    <NModal
      v-model:show="editVisible"
      preset="dialog"
      :title="$t('page.system.settingsPage.edit')"
      :positive-text="$t('page.system.settingsPage.save')"
      :negative-text="$t('page.system.settingsPage.cancel')"
      :loading="editLoading"
      @positive-click="handleSubmitEdit"
    >
      <NSpace v-if="selectedSetting" vertical :size="12">
        <NDescriptions bordered :column="1" label-placement="left" size="small">
          <NDescriptionsItem :label="$t('page.system.settingsPage.name')">
            {{ selectedSetting.name }}
          </NDescriptionsItem>
          <NDescriptionsItem
            :label="$t('page.system.settingsPage.defaultValue')"
          >
            {{ formatValue(selectedSetting.defaultValue) }}
          </NDescriptionsItem>
        </NDescriptions>
        <NInput
          v-model:value="editingValue"
          clearable
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :placeholder="$t('page.system.settingsPage.valuePlaceholder')"
        />
      </NSpace>
    </NModal>
  </Page>
</template>
