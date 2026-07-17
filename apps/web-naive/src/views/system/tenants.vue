<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantManagementApi } from '#/models/tenant-management';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  NAvatar,
  NButton,
  NPopconfirm,
  NSpace,
  NTag,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantApi,
  getTenantProfileByIdApi,
  getTenantsWithProfileApi,
  updateTenantProfileApi,
} from '#/api';
import { $t } from '#/locales';
import { TenantStatus, TenantSubscription } from '#/models/tenant-management';

import TenantProfileForm from './TenantProfileForm.vue';

type GridPage = {
  currentPage?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

function formatNullableDate(value?: null | string) {
  return value ? formatDateTime(value) : '-';
}

const tenantStatusMeta = {
  [TenantStatus.Inactive]: { key: 'inactive', type: 'default' },
  [TenantStatus.Active]: { key: 'active', type: 'success' },
  [TenantStatus.Suspended]: { key: 'suspended', type: 'warning' },
  [TenantStatus.Expired]: { key: 'expired', type: 'error' },
  [TenantStatus.Locked]: { key: 'locked', type: 'error' },
} as const;

const tenantSubscriptionMeta = {
  [TenantSubscription.Trial]: { key: 'trial', type: 'default' },
  [TenantSubscription.Basic]: { key: 'basic', type: 'info' },
  [TenantSubscription.Professional]: {
    key: 'professional',
    type: 'success',
  },
  [TenantSubscription.Enterprise]: { key: 'enterprise', type: 'warning' },
} as const;

function getTenantStatusMeta(status?: null | number) {
  return status === null || status === undefined
    ? null
    : tenantStatusMeta[status as TenantStatus];
}

function getTenantStatusLabel(status?: null | number) {
  const meta = getTenantStatusMeta(status);
  return meta
    ? $t(`page.system.tenantsPage.statuses.${meta.key}`)
    : (status?.toString() ?? '-');
}

function getTenantSubscriptionMeta(subscription?: null | number) {
  return subscription === null || subscription === undefined
    ? null
    : tenantSubscriptionMeta[subscription as TenantSubscription];
}

function getTenantSubscriptionLabel(subscription?: null | number) {
  const meta = getTenantSubscriptionMeta(subscription);
  return meta
    ? $t(`page.system.tenantsPage.subscriptions.${meta.key}`)
    : (subscription?.toString() ?? '-');
}

const gridOptions: VxeGridProps<TenantManagementApi.TenantItem> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: $t('page.system.tenantsPage.actions'),
      width: 150,
    },
    {
      align: 'center',
      field: 'profile.logoUrl',
      slots: { default: 'logoCell' },
      title: $t('page.system.tenantsPage.logo'),
      width: 90,
    },
    {
      align: 'center',
      title: '#',
      type: 'seq',
      width: 60,
      fixed: 'left',
    },
    {
      field: 'name',
      fixed: 'left',
      minWidth: 180,
      title: $t('page.system.tenantsPage.name'),
    },
    {
      field: 'profile.url',
      minWidth: 240,
      slots: { default: 'urlCell' },
      title: $t('page.system.tenantsPage.url'),
    },
    {
      align: 'center',
      field: 'profile.subscription',
      slots: { default: 'subscriptionCell' },
      title: $t('page.system.tenantsPage.subscription'),
      width: 130,
    },
    {
      align: 'center',
      field: 'profile.status',
      slots: { default: 'statusCell' },
      title: $t('page.system.tenantsPage.status'),
      width: 120,
    },
    {
      field: 'profile.expiresAt',
      formatter: ({ row }: { row: TenantManagementApi.TenantItem }) =>
        formatNullableDate(row.profile?.expiresAt),
      title: $t('page.system.tenantsPage.expiresAt'),
      width: 190,
    },
    {
      field: 'profile.lockedEnd',
      formatter: ({ row }: { row: TenantManagementApi.TenantItem }) =>
        formatNullableDate(row.profile?.lockedEnd),
      title: $t('page.system.tenantsPage.lockedEnd'),
      width: 190,
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        formatNullableDate(cellValue),
      title: $t('page.system.tenantsPage.creationTime'),
      width: 190,
    },
    {
      field: 'modificationTime',
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        formatNullableDate(cellValue),
      title: $t('page.system.tenantsPage.modificationTime'),
      width: 190,
    },
  ],
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: { page: GridPage }) => {
        const response = await getTenantsWithProfileApi({
          current: page.currentPage ?? 1,
          pageSize: page.pageSize ?? DEFAULT_PAGE_SIZE,
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

const [Grid, gridApi] = useVbenVxeGrid<TenantManagementApi.TenantItem>({
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: TenantProfileForm,
});

async function handleEdit(row: TenantManagementApi.TenantItem) {
  const response = await getTenantProfileByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy thông tin tenant');
    return;
  }

  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

async function copyTenantId(tenantId: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(tenantId);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = tenantId;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  message.success($t('page.system.tenantsPage.copyIdSuccess'));
}

async function handleDelete(row: TenantManagementApi.TenantItem) {
  await deleteTenantApi(row.id);
  message.success($t('page.system.tenantsPage.deleteSuccess'));
  await gridApi.query();
}

async function handleSubmit(
  payload: TenantManagementApi.UpdateTenantProfilePayload,
) {
  const { tenantId, ...data } = payload;
  await updateTenantProfileApi(tenantId, data);
  message.success('Cập nhật thông tin người thuê thành công');
  drawerApi.close();
  await gridApi.query();
}
</script>

<template>
  <Page
    :description="$t('page.system.tenantsPage.description')"
    :title="$t('page.system.tenants')"
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
                type="primary"
                @click="handleEdit(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:pencil" />
                </template>
              </NButton>
            </template>
            {{ $t('page.system.tenantsPage.edit') }}
          </NTooltip>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="info"
                @click="copyTenantId(row.id)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:copy" />
                </template>
              </NButton>
            </template>
            {{ $t('page.system.tenantsPage.copyId') }}
          </NTooltip>

          <NPopconfirm
            :negative-text="$t('page.system.tenantsPage.cancel')"
            :positive-text="$t('page.system.tenantsPage.delete')"
            @positive-click="() => handleDelete(row)"
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
                {{ $t('page.system.tenantsPage.delete') }}
              </NTooltip>
            </template>
            {{ $t('page.system.tenantsPage.deleteConfirm', [row.name]) }}
          </NPopconfirm>
        </NSpace>
      </template>

      <template #logoCell="{ row }">
        <NAvatar
          v-if="row.profile?.logoUrl"
          :src="row.profile.logoUrl"
          object-fit="contain"
          round
          size="medium"
        />
        <NAvatar
          v-else
          round
          size="medium"
          :style="{ backgroundColor: '#18a058' }"
        >
          {{ row.name?.charAt(0)?.toUpperCase() || 'T' }}
        </NAvatar>
      </template>

      <template #urlCell="{ row }">
        <a
          v-if="row.profile?.url"
          class="break-all text-primary hover:underline"
          :href="row.profile.url"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ row.profile.url }}
        </a>
        <span v-else>-</span>
      </template>

      <template #subscriptionCell="{ row }">
        <NTag
          v-if="
            row.profile?.subscription !== null &&
            row.profile?.subscription !== undefined
          "
          :bordered="false"
          size="small"
          :type="getTenantSubscriptionMeta(row.profile.subscription)?.type"
        >
          {{ getTenantSubscriptionLabel(row.profile.subscription) }}
        </NTag>
        <span v-else>-</span>
      </template>

      <template #statusCell="{ row }">
        <NTag
          v-if="
            row.profile?.status !== null && row.profile?.status !== undefined
          "
          :bordered="false"
          size="small"
          :type="getTenantStatusMeta(row.profile.status)?.type"
        >
          {{ getTenantStatusLabel(row.profile.status) }}
        </NTag>
        <span v-else>-</span>
      </template>
    </Grid>

    <Drawer @submit="handleSubmit" />
  </Page>
</template>
