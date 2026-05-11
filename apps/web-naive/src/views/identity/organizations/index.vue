<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NCard,
  NPopconfirm,
  NSpin,
  NSwitch,
  useMessage,
} from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { requestClient } from '#/api/request';
import OrganizationTree from '#/components/OrganizationTree.vue';

interface OrgItem {
  code?: string;
  displayName?: string;
  id: string;
  parentId?: string;
  userCount?: number;
}

const message = useMessage();
const loading = ref(false);
const dataSource = ref<OrgItem[]>([]);

// display mode: 'tree' | 'table'
const displayMode = ref<'table' | 'tree'>('tree');

const isTree = computed<boolean>({
  get: () => displayMode.value === 'tree',
  set: (v: boolean) => {
    displayMode.value = v ? 'tree' : 'table';
  },
});

async function loadOrgs() {
  loading.value = true;
  try {
    const res = await requestClient.get<any>('/api/identity/organization-unit', {
      responseReturn: 'body',
    });
    const items = res?.data ?? res ?? [];
    dataSource.value = items.map((i: any) => ({
      code: i.code,
      displayName: i.displayName,
      id: i.id,
      parentId: i.parentId,
      userCount: i.userCount,
    }));
  } catch (error: any) {
    console.error(error);
    message.error(error?.message ?? 'Tải danh sách tổ chức thất bại');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrgs();
});

// ─── VxeGrid (table mode) ─────────────────────────────────────────────────────
const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: 'Tìm kiếm tên hoặc mã tổ chức...' },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

interface OrgRow {
  code?: string;
  displayName?: string;
  id: string;
  parentId?: string;
  userCount?: number;
}

const gridOptions: VxeGridProps<OrgRow> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: 'Thao tác',
      width: 120,
    },
    { align: 'center', title: 'STT', type: 'seq', width: 60 },
    { field: 'displayName', minWidth: 200, title: 'Tên tổ chức' },
    { field: 'code', minWidth: 140, title: 'Mã' },
    {
      align: 'right',
      field: 'userCount',
      title: 'Số người dùng',
      width: 140,
    },
  ],
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const current = page.currentPage ?? 1;
        const pageSize = page.pageSize ?? 10;
        const res = await requestClient.get<any>(
          '/api/identity/organization-unit',
          { responseReturn: 'body' },
        );
        const raw = res?.data ?? res ?? [];
        const keyword = formValues?.keyword?.trim?.().toLowerCase?.() ?? '';
        const filtered = keyword
          ? raw.filter((i: any) => {
              const name = (i.displayName ?? '').toLowerCase();
              const code = (i.code ?? '').toLowerCase();
              return name.includes(keyword) || code.includes(keyword);
            })
          : raw;
        const total = filtered.length;
        const start = (current - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize).map((i: any) => ({
          code: i.code,
          displayName: i.displayName,
          id: i.id,
          parentId: i.parentId,
          userCount: i.userCount,
        }));
        return { items: pageItems, total } as any;
      },
    },
  },
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: true,
    // @ts-ignore
    search: true,
  },
};

const [VxeGrid, gridApi] = useVbenVxeGrid<OrgRow>({ formOptions, gridOptions });

function handleEditOrg(row: OrgRow) {
  message.info(`Chỉnh sửa: ${row.displayName ?? row.code ?? row.id}`);
  // TODO: mở Drawer/Form chỉnh sửa
}

async function handleDeleteOrg(row: OrgRow) {
  const id = row?.id;
  if (!id) return;
  try {
    await requestClient.delete(`/api/identity/organization-unit/${id}`);
    message.success('Xóa tổ chức thành công');
    gridApi?.query?.();
  } catch (error: any) {
    message.error(
      error?.message ?? error?.response?.data?.message ?? 'Xóa tổ chức thất bại',
    );
  }
}
</script>

<template>
  <Page auto-content-height>
    <!-- Tree mode -->
    <NCard v-if="displayMode === 'tree'" class="shadow-sm">
      <div class="mb-4 flex items-center gap-3">
        <NSwitch v-model:value="isTree">
          <template #checked>Cây</template>
          <template #unchecked>Bảng</template>
        </NSwitch>
        <span class="text-sm text-gray-500">Chế độ hiển thị</span>
      </div>

      <NSpin :show="loading">
        <OrganizationTree :items="dataSource" />
      </NSpin>
    </NCard>

    <!-- Table mode -->
    <NCard v-else class="shadow-sm">
      <div class="vp-raw w-full">
        <VxeGrid>
          <template #toolbar-actions>
            <div class="flex items-center gap-2">
              <NSwitch v-model:value="isTree">
                <template #checked>Cây</template>
                <template #unchecked>Bảng</template>
              </NSwitch>
              <span class="text-sm">Chế độ hiển thị</span>
            </div>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center justify-center gap-1">
              <!-- Edit -->
              <NButton
                quaternary
                size="tiny"
                type="primary"
                :title="'Chỉnh sửa'"
                @click="handleEditOrg(row)"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:pencil" />
                </template>
              </NButton>

              <!-- Delete with confirm -->
              <NPopconfirm @positive-click="() => handleDeleteOrg(row)">
                <template #trigger>
                  <NButton
                    quaternary
                    size="tiny"
                    type="error"
                    :title="'Xóa'"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Bạn có chắc muốn xóa tổ chức
                <strong>{{ row.displayName ?? row.code }}</strong> không?
              </NPopconfirm>
            </div>
          </template>
        </VxeGrid>
      </div>
    </NCard>
  </Page>
</template>
