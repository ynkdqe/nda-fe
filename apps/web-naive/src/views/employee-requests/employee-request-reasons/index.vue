<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmployeeRequestReasonApi,
  deleteEmployeeRequestReasonApi,
  getEmployeeRequestReasonByIdApi,
  getEmployeeRequestReasonListApi,
  getEmployeeRequestTypeListApi,
  updateEmployeeRequestReasonApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';

import EmployeeRequestReasonForm from './EmployeeRequestReasonForm.vue';

const { hasAccessByCodes } = useAccess();
// Tách theo từng thao tác để khớp với permission CRUD riêng biệt ở backend.
const canCreate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.createReasons]),
);
const canUpdate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.updateReasons]),
);
const canDelete = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.deleteReasons]),
);

const deletingId = ref<null | number>(null);
const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const typeMap = computed(() => new Map(types.value.map((x) => [x.id, x])));
async function loadTypes() {
  const r = await getEmployeeRequestTypeListApi({ current: 1, pageSize: 100 });
  types.value = (r.data ?? [])
    .filter((x) => !x.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
}
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-3',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: 'Từ khóa',
      componentProps: { placeholder: 'Nhập tên lý do' },
    },
    {
      component: 'Select',
      fieldName: 'employeeRequestTypeId',
      label: 'Loại đơn',
      componentProps: () => ({
        clearable: true,
        options: types.value.map((x) => ({ label: x.name, value: x.id })),
      }),
    },
    {
      component: 'Select',
      fieldName: 'isActive',
      label: 'Trạng thái',
      componentProps: {
        clearable: true,
        options: [
          { label: 'Đang hoạt động', value: true },
          { label: 'Ngừng hoạt động', value: false },
        ],
      },
    },
  ],
};
const gridOptions: VxeGridProps<EmployeeRequestReasonApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    {
      field: 'employeeRequestTypeId',
      title: 'Loại đơn',
      slots: { default: 'typeCell' },
      minWidth: 180,
    },
    { field: 'name', title: 'Tên lý do', minWidth: 180 },
    { field: 'description', title: 'Mô tả', minWidth: 220 },
    {
      align: 'center',
      field: 'display',
      title: 'Thứ tự hiển thị',
      width: 140,
    },
    {
      align: 'center',
      field: 'isActive',
      title: 'Trạng thái',
      slots: { default: 'statusCell' },
      width: 150,
    },
    {
      align: 'center',
      fixed: 'right',
      title: 'Thao tác',
      slots: { default: 'actions' },
      width: 120,
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, v: Record<string, any>) => {
        const keyword = v?.keyword?.trim?.();
        const params: EmployeeRequestReasonApi.ListParams = {
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(keyword ? { keyword } : {}),
          ...(typeof v?.employeeRequestTypeId === 'number'
            ? { employeeRequestTypeId: v.employeeRequestTypeId }
            : {}),
          ...(typeof v?.isActive === 'boolean' ? { isActive: v.isActive } : {}),
        };
        const r = await getEmployeeRequestReasonListApi(params);
        let items = (r.data ?? []).filter((x) => !x.isDeleted);
        if (typeof v?.employeeRequestTypeId === 'number')
          items = items.filter(
            (x) => x.employeeRequestTypeId === v.employeeRequestTypeId,
          );
        if (typeof v?.isActive === 'boolean')
          items = items.filter((x) => x.isActive === v.isActive);
        // Sắp xếp theo thứ tự hiển thị để khớp với các dropdown chọn lý do.
        items = [...items].sort((a, b) => a.display - b.display || a.id - b.id);
        return { items, total: r.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};
const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestReasonApi.Item>({
  formOptions,
  gridOptions,
});
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestReasonForm,
});
function permitted(allowed: boolean) {
  if (allowed) return true;
  message.warning('Bạn không có quyền thực hiện thao tác này');
  return false;
}
function add() {
  if (!permitted(canCreate.value)) return;
  drawerApi.setData({ record: null, types: types.value });
  drawerApi.open();
}
async function edit(row: EmployeeRequestReasonApi.Item) {
  if (!permitted(canUpdate.value)) return;
  const r = await getEmployeeRequestReasonByIdApi(row.id);
  if (!r.data) {
    message.error(r.message ?? 'Không tìm thấy lý do');
    return;
  }
  drawerApi.setData({ record: r.data, types: types.value });
  drawerApi.open();
}
async function submit(
  p:
    | EmployeeRequestReasonApi.CreateInput
    | EmployeeRequestReasonApi.UpdateInput,
) {
  if (!permitted('id' in p ? canUpdate.value : canCreate.value)) return;
  drawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in p) {
      await updateEmployeeRequestReasonApi(p.id, p);
      message.success('Cập nhật lý do thành công');
    } else {
      await createEmployeeRequestReasonApi(p);
      message.success('Tạo lý do thành công');
    }
    drawerApi.close();
    await gridApi.query();
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}
async function remove(row: EmployeeRequestReasonApi.Item) {
  if (!permitted(canDelete.value) || deletingId.value !== null) return;
  deletingId.value = row.id;
  try {
    await deleteEmployeeRequestReasonApi(row.id);
    message.success('Xóa lý do thành công');
    await gridApi.query();
  } finally {
    deletingId.value = null;
  }
}
onMounted(loadTypes);
</script>
<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" :disabled="!canCreate" @click="add">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>Thêm mới
        </NButton> </template
      ><template #typeCell="{ row }">
        {{
          row.employeeRequestType?.name ??
          typeMap.get(row.employeeRequestTypeId)?.name ??
          'Loại đơn đã bị xóa'
        }} </template
      ><template #statusCell="{ row }">
        <NTag :type="row.isActive ? 'success' : 'default'" size="small">
          {{ row.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động' }}
        </NTag> </template
      ><template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip>
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
            >Sửa </NTooltip
          ><NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
            @positive-click="() => remove(row)"
          >
            <template #trigger>
              <NTooltip>
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
              </NTooltip> </template
            >Bạn có chắc chắn muốn xóa lý do '{{ row.name }}' không?
          </NPopconfirm>
        </NSpace>
      </template> </Grid
    ><Drawer @submit="submit" />
  </Page>
</template>
