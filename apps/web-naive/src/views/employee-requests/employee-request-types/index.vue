<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmployeeRequestTypeApi,
  deleteEmployeeRequestTypeApi,
  getEmployeeRequestTypeByIdApi,
  getEmployeeRequestTypeListApi,
  updateEmployeeRequestTypeApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';

import EmployeeRequestTypeForm from './EmployeeRequestTypeForm.vue';

const { hasAccessByCodes } = useAccess();
// Tách theo từng thao tác để khớp với permission CRUD riêng biệt ở backend.
const canCreate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.createTypes]),
);
const canUpdate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.updateTypes]),
);
const canDelete = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.deleteTypes]),
);

const deletingId = ref<null | number>(null);
const maxDisplayOrder = ref(-1);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: 'Nhập tên loại đơn' },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
  ],
  showCollapseButton: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<EmployeeRequestTypeApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    {
      align: 'center',
      field: 'icon',
      slots: { default: 'iconCell' },
      title: 'Icon',
      width: 90,
    },
    { field: 'name', minWidth: 180, title: 'Tên loại đơn' },
    { field: 'description', minWidth: 240, title: 'Mô tả' },
    {
      align: 'center',
      field: 'displayOrder',
      title: 'Thứ tự hiển thị',
      width: 150,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: 'Thao tác',
      width: 120,
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, values: Record<string, any>) => {
        const keyword = values?.keyword?.trim?.();
        const response = await getEmployeeRequestTypeListApi({
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(keyword ? { keyword } : {}),
        });
        const items = (response.data ?? [])
          .filter((item) => !item.isDeleted)
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
        maxDisplayOrder.value = -1;
        for (const item of items) {
          maxDisplayOrder.value = Math.max(
            maxDisplayOrder.value,
            item.displayOrder,
          );
        }
        return { items, total: response.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};

const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestTypeApi.Item>({
  formOptions,
  gridOptions,
});
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestTypeForm,
});

function permitted(allowed: boolean) {
  if (allowed) return true;
  message.warning('Bạn không có quyền thực hiện thao tác này');
  return false;
}

function add() {
  if (!permitted(canCreate.value)) return;
  drawerApi.setData({
    defaultDisplayOrder: maxDisplayOrder.value + 1,
    record: null,
  });
  drawerApi.open();
}

async function edit(row: EmployeeRequestTypeApi.Item) {
  if (!permitted(canUpdate.value)) return;
  const response = await getEmployeeRequestTypeByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy loại đơn');
    return;
  }
  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

async function submit(
  payload:
    | EmployeeRequestTypeApi.CreateInput
    | EmployeeRequestTypeApi.UpdateInput,
) {
  if (!permitted('id' in payload ? canUpdate.value : canCreate.value)) return;
  drawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in payload) {
      await updateEmployeeRequestTypeApi(payload.id, payload);
      message.success('Cập nhật loại đơn thành công');
    } else {
      await createEmployeeRequestTypeApi(payload);
      message.success('Tạo loại đơn thành công');
    }
    drawerApi.close();
    await gridApi.query();
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}

async function remove(row: EmployeeRequestTypeApi.Item) {
  if (!permitted(canDelete.value) || deletingId.value !== null) return;
  deletingId.value = row.id;
  try {
    await deleteEmployeeRequestTypeApi(row.id);
    message.success('Xóa loại đơn thành công');
    await gridApi.query();
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" :disabled="!canCreate" @click="add">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>Thêm mới
        </NButton>
      </template>
      <template #iconCell="{ row }">
        <IconifyIcon v-if="row.icon" class="mx-auto size-5" :icon="row.icon" />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                :disabled="!canUpdate"
                quaternary
                size="small"
                type="primary"
                @click="edit(row)"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:pencil" />
                </template>
              </NButton> </template
            >Sửa
          </NTooltip>
          <NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
            @positive-click="() => remove(row)"
          >
            <template #trigger>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    circle
                    quaternary
                    size="small"
                    type="error"
                    :disabled="!canDelete || deletingId !== null"
                    :loading="deletingId === row.id"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:trash-2" />
                    </template>
                  </NButton> </template
                >Xóa
              </NTooltip>
            </template>
            Bạn có chắc chắn muốn xóa loại đơn '{{ row.name }}' không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>
    <Drawer @submit="submit" />
  </Page>
</template>
