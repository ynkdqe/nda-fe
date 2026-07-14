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

import TenantProfileForm from './TenantProfileForm.vue';

type GridPage = {
  currentPage?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

function formatNullableDate(value?: null | string) {
  return value ? formatDateTime(value) : '-';
}

const gridOptions: VxeGridProps<TenantManagementApi.TenantItem> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: $t('page.system.tenantsPage.actions'),
      width: 110,
    },
    {
      align: 'center',
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      align: 'center',
      field: 'profile.logoUrl',
      slots: { default: 'logoCell' },
      title: $t('page.system.tenantsPage.logo'),
      width: 90,
    },
    {
      field: 'name',
      fixed: 'left',
      minWidth: 180,
      title: $t('page.system.tenantsPage.name'),
    },
    {
      field: 'id',
      minWidth: 280,
      title: $t('page.system.tenantsPage.id'),
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
          :fallback-src="undefined"
          :src="row.profile?.logoUrl || undefined"
          :style="{
            backgroundColor: row.profile?.logoUrl ? undefined : '#18a058',
          }"
          object-fit="contain"
          round
          size="medium"
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
        <NTag v-if="row.profile" :bordered="false" size="small" type="info">
          {{ row.profile.subscription ?? '-' }}
        </NTag>
        <span v-else>-</span>
      </template>

      <template #statusCell="{ row }">
        <NTag
          v-if="row.profile"
          :bordered="false"
          size="small"
          :type="row.profile.status === 1 ? 'success' : 'default'"
        >
          {{ row.profile.status ?? '-' }}
        </NTag>
        <span v-else>-</span>
      </template>
    </Grid>

    <Drawer @submit="handleSubmit" />
  </Page>
</template>
