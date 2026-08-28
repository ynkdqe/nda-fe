<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmployeeRequestPolicyApi,
  deleteEmployeeRequestPolicyApi,
  getEmployeeRequestPolicyByIdApi,
  getEmployeeRequestPolicyListApi,
  getEmployeeRequestReasonListApi,
  getEmployeeRequestTypeListApi,
  updateEmployeeRequestPolicyApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';

import PaidStatusBadge from '../shared/PaidStatusBadge.vue';
import EmployeeRequestPolicyForm from './EmployeeRequestPolicyForm.vue';
const { hasAccessByCodes } = useAccess();
const canManage = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.managePolicies]),
);
const deletingId = ref<null | number>(null);
const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const reasons = ref<EmployeeRequestReasonApi.Item[]>([]);
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
const typeMap = computed(() => new Map(types.value.map((x) => [x.id, x])));
const reasonMap = computed(() => new Map(reasons.value.map((x) => [x.id, x])));
async function loadDependencies() {
  const [tr, rr] = await Promise.all([
    getEmployeeRequestTypeListApi({ current: 1, pageSize: 100 }),
    getEmployeeRequestReasonListApi({ current: 1, pageSize: 100 }),
  ]);
  types.value = (tr.data ?? [])
    .filter((x) => !x.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  reasons.value = (rr.data ?? []).filter((x) => !x.isDeleted);
}
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  schema: [
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
      fieldName: 'employeeRequestReasonId',
      label: 'Lý do',
      componentProps: (v: any) => ({
        clearable: true,
        disabled: !v?.employeeRequestTypeId,
        options: reasons.value
          .filter(
            (x) =>
              !v?.employeeRequestTypeId ||
              x.employeeRequestTypeId === v.employeeRequestTypeId,
          )
          .map((x) => ({ label: x.name, value: x.id })),
      }),
    },
  ],
};
const gridOptions: VxeGridProps<EmployeeRequestPolicyApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    {
      field: 'employeeRequestTypeId',
      title: 'Loại đơn',
      slots: { default: 'typeCell' },
      minWidth: 180,
    },
    {
      field: 'employeeRequestReasonId',
      title: 'Lý do',
      slots: { default: 'reasonCell' },
      minWidth: 180,
    },
    {
      align: 'center',
      field: 'paid',
      title: 'Tính lương',
      slots: { default: 'paidCell' },
      width: 150,
    },
    { align: 'right', field: 'maxTime', title: 'Hạn mức tối đa', width: 150 },
    {
      align: 'center',
      field: 'unit',
      title: 'Đơn vị',
      slots: { default: 'unitCell' },
      width: 110,
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
        const params: EmployeeRequestPolicyApi.ListParams = {
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(typeof v?.employeeRequestTypeId === 'number'
            ? { employeeRequestTypeId: v.employeeRequestTypeId }
            : {}),
          ...(typeof v?.employeeRequestReasonId === 'number'
            ? { employeeRequestReasonId: v.employeeRequestReasonId }
            : {}),
        };
        const r = await getEmployeeRequestPolicyListApi(params);
        let items = (r.data ?? []).filter((x) => !x.isDeleted);
        if (typeof v?.employeeRequestTypeId === 'number')
          items = items.filter(
            (x) => x.employeeRequestTypeId === v.employeeRequestTypeId,
          );
        if (typeof v?.employeeRequestReasonId === 'number')
          items = items.filter(
            (x) => x.employeeRequestReasonId === v.employeeRequestReasonId,
          );
        policies.value = items;
        return { items, total: r.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};
const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestPolicyApi.Item>({
  formOptions,
  gridOptions,
});
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestPolicyForm,
});
function permitted() {
  if (canManage.value) return true;
  message.warning('Bạn không có quyền thực hiện thao tác này');
  return false;
}
function data(record: EmployeeRequestPolicyApi.Item | null) {
  return {
    policies: policies.value,
    reasons: reasons.value,
    record,
    types: types.value,
  };
}
function add() {
  if (!permitted()) return;
  drawerApi.setData(data(null));
  drawerApi.open();
}
async function edit(row: EmployeeRequestPolicyApi.Item) {
  if (!permitted()) return;
  const r = await getEmployeeRequestPolicyByIdApi(row.id);
  if (!r.data) {
    message.error(r.message ?? 'Không tìm thấy chính sách');
    return;
  }
  drawerApi.setData(data(r.data));
  drawerApi.open();
}
async function submit(
  p:
    | EmployeeRequestPolicyApi.CreateInput
    | EmployeeRequestPolicyApi.UpdateInput,
) {
  if (!permitted()) return;
  drawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in p) {
      await updateEmployeeRequestPolicyApi(p.id, p);
      message.success('Cập nhật chính sách thành công');
    } else {
      await createEmployeeRequestPolicyApi(p);
      message.success('Tạo chính sách thành công');
    }
    drawerApi.close();
    await gridApi.query();
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}
async function remove(row: EmployeeRequestPolicyApi.Item) {
  if (!permitted() || deletingId.value !== null) return;
  deletingId.value = row.id;
  try {
    await deleteEmployeeRequestPolicyApi(row.id);
    message.success('Xóa chính sách thành công');
    await gridApi.query();
  } finally {
    deletingId.value = null;
  }
}
onMounted(loadDependencies);
</script>
<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" :disabled="!canManage" @click="add">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>Thêm mới
        </NButton> </template
      ><template #typeCell="{ row }">
        {{
          typeMap.get(row.employeeRequestTypeId)?.name ?? 'Loại đơn đã bị xóa'
        }} </template
      ><template #reasonCell="{ row }">
        {{
          reasonMap.get(row.employeeRequestReasonId)?.name ?? 'Lý do đã bị xóa'
        }} </template
      ><template #paidCell="{ row }">
        <PaidStatusBadge :paid="row.paid" /> </template
      ><template #unitCell="{ row }">
        {{
          row.unit === 'Day'
            ? 'Ngày'
            : row.unit === 'Hour'
              ? 'Giờ'
              : (row.unit ?? '-')
        }} </template
      ><template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip>
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="primary"
                :disabled="!canManage"
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
                    :disabled="!canManage || deletingId !== null"
                    :loading="deletingId === row.id"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:trash-2" />
                    </template>
                  </NButton> </template
                >Xóa
              </NTooltip> </template
            >Bạn có chắc chắn muốn xóa chính sách của lý do '{{
              reasonMap.get(row.employeeRequestReasonId)?.name ?? 'đã bị xóa'
            }}' không?
          </NPopconfirm>
        </NSpace>
      </template> </Grid
    ><Drawer @submit="submit" />
  </Page>
</template>
