<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OpenIddictApplicationApi } from '#/models/openiddict';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  NButton,
  NModal,
  NPopconfirm,
  NScrollbar,
  NSpace,
  NTag,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createOpenIddictApplicationApi,
  deleteOpenIddictApplicationApi,
  getOpenIddictApplicationByIdApi,
  getOpenIddictApplicationsApi,
  updateOpenIddictApplicationApi,
} from '#/api';
import SearchableTagList from '#/components/SearchableTagList.vue';
import { $t } from '#/locales';

import OpenIddictApplicationForm from './OpenIddictApplicationForm.vue';

type GridPage = {
  currentPage?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;
const showUriDetailsModal = ref(false);
const selectedApplication = ref<
  null | OpenIddictApplicationApi.ApplicationItem
>(null);

function formatNullableDate(value?: null | string) {
  return value ? formatDateTime(value) : '-';
}

const gridOptions: VxeGridProps<OpenIddictApplicationApi.ApplicationItem> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: $t('page.system.authenticationPage.actions'),
      width: 110,
    },
    {
      align: 'center',
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'clientId',
      fixed: 'left',
      minWidth: 180,
      title: $t('page.system.authenticationPage.clientId'),
    },
    {
      field: 'displayName',
      minWidth: 220,
      title: $t('page.system.authenticationPage.displayName'),
    },
    {
      field: 'applicationType',
      slots: { default: 'applicationTypeCell' },
      title: $t('page.system.authenticationPage.applicationType'),
      width: 140,
    },
    {
      field: 'clientType',
      slots: { default: 'clientTypeCell' },
      title: $t('page.system.authenticationPage.clientType'),
      width: 140,
    },
    {
      field: 'consentType',
      slots: { default: 'consentTypeCell' },
      title: $t('page.system.authenticationPage.consentType'),
      width: 140,
    },
    {
      align: 'center',
      slots: { default: 'uriDetailsCell' },
      title: $t('page.system.authenticationPage.details'),
      width: 130,
    },
    {
      field: 'grantTypes',
      minWidth: 300,
      slots: { default: 'grantTypesCell' },
      title: $t('page.system.authenticationPage.grantTypes'),
    },
    {
      field: 'scopes',
      minWidth: 320,
      slots: { default: 'scopesCell' },
      title: $t('page.system.authenticationPage.scopes'),
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        formatNullableDate(cellValue),
      title: $t('page.system.authenticationPage.creationTime'),
      width: 190,
    },
    {
      field: 'lastModificationTime',
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        formatNullableDate(cellValue),
      title: $t('page.system.authenticationPage.lastModificationTime'),
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
        const response = await getOpenIddictApplicationsApi({
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

const [Grid, gridApi] =
  useVbenVxeGrid<OpenIddictApplicationApi.ApplicationItem>({
    gridOptions,
  });

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: OpenIddictApplicationForm,
});

function handleAdd() {
  drawerApi.setData({ record: null });
  drawerApi.open();
}

function handleViewUriDetails(
  row: OpenIddictApplicationApi.ApplicationItem,
) {
  selectedApplication.value = row;
  showUriDetailsModal.value = true;
}

async function handleEdit(row: OpenIddictApplicationApi.ApplicationItem) {
  const response = await getOpenIddictApplicationByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy ứng dụng xác thực');
    return;
  }

  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

async function handleDelete(row: OpenIddictApplicationApi.ApplicationItem) {
  await deleteOpenIddictApplicationApi(row.id);
  message.success('Xóa ứng dụng xác thực thành công');
  await gridApi.query();
}

async function handleSubmit(
  payload: OpenIddictApplicationApi.ApplicationFormPayload,
) {
  const { clientId, id, ...updatePayload } = payload;

  if (id) {
    await updateOpenIddictApplicationApi(id, updatePayload);
    message.success('Cập nhật ứng dụng xác thực thành công');
  } else {
    await createOpenIddictApplicationApi({
      ...updatePayload,
      clientId,
    });
    message.success('Thêm ứng dụng xác thực thành công');
  }

  drawerApi.close();
  await gridApi.query();
}
</script>

<template>
  <Page
    :description="$t('page.system.authenticationPage.description')"
    :title="$t('page.system.authentication')"
  >
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('page.system.authenticationPage.add') }}
        </NButton>
      </template>

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
            {{ $t('page.system.authenticationPage.edit') }}
          </NTooltip>

          <NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
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
                {{ $t('page.system.authenticationPage.delete') }}
              </NTooltip>
            </template>
            Bạn có chắc muốn xóa ứng dụng {{ row.clientId }} không?
          </NPopconfirm>
        </NSpace>
      </template>

      <template #applicationTypeCell="{ row }">
        <NTag :bordered="false" size="small" type="info">
          {{ row.applicationType || '-' }}
        </NTag>
      </template>

      <template #clientTypeCell="{ row }">
        <NTag
          :bordered="false"
          size="small"
          :type="row.clientType === 'confidential' ? 'warning' : 'success'"
        >
          {{ row.clientType || '-' }}
        </NTag>
      </template>

      <template #consentTypeCell="{ row }">
        <NTag :bordered="false" size="small">
          {{ row.consentType || '-' }}
        </NTag>
      </template>

      <template #uriDetailsCell="{ row }">
        <NButton text type="primary" @click="handleViewUriDetails(row)">
          {{ $t('page.system.authenticationPage.viewDetails') }}
        </NButton>
      </template>

      <template #grantTypesCell="{ row }">
        <SearchableTagList
          :items="row.grantTypes"
          :max-visible="2"
          tag-type="primary"
        />
      </template>

      <template #scopesCell="{ row }">
        <SearchableTagList :items="row.scopes" :max-visible="4" />
      </template>
    </Grid>

    <Drawer @submit="handleSubmit" />

    <NModal
      v-model:show="showUriDetailsModal"
      preset="card"
      :title="$t('page.system.authenticationPage.uriDetailsTitle')"
      class="max-w-[760px]"
    >
      <NScrollbar class="max-h-[70vh] pr-2">
        <NSpace vertical :size="20">
          <section>
            <h3 class="mb-2 font-semibold">
              {{ $t('page.system.authenticationPage.redirectUris') }}
            </h3>
            <ul
              v-if="selectedApplication?.redirectUris?.length"
              class="list-disc space-y-2 pl-5"
            >
              <li
                v-for="uri in selectedApplication.redirectUris"
                :key="uri"
                class="break-all"
              >
                {{ uri }}
              </li>
            </ul>
            <span v-else class="text-muted-foreground">
              {{ $t('page.system.authenticationPage.emptyUris') }}
            </span>
          </section>

          <section>
            <h3 class="mb-2 font-semibold">
              {{
                $t(
                  'page.system.authenticationPage.postLogoutRedirectUris',
                )
              }}
            </h3>
            <ul
              v-if="selectedApplication?.postLogoutRedirectUris?.length"
              class="list-disc space-y-2 pl-5"
            >
              <li
                v-for="uri in selectedApplication.postLogoutRedirectUris"
                :key="uri"
                class="break-all"
              >
                {{ uri }}
              </li>
            </ul>
            <span v-else class="text-muted-foreground">
              {{ $t('page.system.authenticationPage.emptyUris') }}
            </span>
          </section>
        </NSpace>
      </NScrollbar>
    </NModal>
  </Page>
</template>
