<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestQuotaApi } from '#/models/employee-requests/employee-request-quota';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  generateEmployeeRequestQuotaApi,
  getEmployeeRequestPolicyListApi,
  getEmployeeRequestQuotaListApi,
  updateEmployeeRequestQuotaApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';
import { EmployeeRequestEffect } from '#/models/employee-requests/employee-request';

import EmployeeRequestQuotaForm from './EmployeeRequestQuotaForm.vue';
import EmployeeRequestQuotaGenerateForm from './EmployeeRequestQuotaGenerateForm.vue';
const { hasAccessByCodes } = useAccess();
const canUpdate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.updateQuotas]),
);
const canGenerate = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.generateQuotas]),
);
const currentYear = new Date().getFullYear();
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
/** Chỉ chính sách nghỉ trừ phép và có hạn mức mới cần cấp quyền lợi theo năm. */
async function loadPolicies() {
  const r = await getEmployeeRequestPolicyListApi({
    current: 1,
    pageSize: 100,
  });
  policies.value = (r.data ?? []).filter(
    (x) =>
      !x.isDeleted &&
      x.effectKind === EmployeeRequestEffect.LeaveWithQuota &&
      (x.maxTime ?? 0) > 0,
  );
}
const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-3',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: 'Nhân viên',
      componentProps: { clearable: true, placeholder: 'Tên hoặc mã nhân viên' },
    },
    {
      component: 'InputNumber',
      fieldName: 'year',
      label: 'Năm',
      defaultValue: currentYear,
      componentProps: { min: 2000, max: 2100, showButton: false },
    },
    {
      component: 'Select',
      fieldName: 'employeeRequestPolicyId',
      label: 'Chính sách',
      componentProps: () => ({
        clearable: true,
        options: policies.value.map((x) => ({
          label: `${x.employeeRequestTypeName ?? ''} - ${x.employeeRequestReasonName ?? ''}`,
          value: x.id,
        })),
      }),
    },
  ],
};
const gridOptions: VxeGridProps<EmployeeRequestQuotaApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    { field: 'employeeCode', title: 'Mã NV', width: 110 },
    { field: 'employeeName', title: 'Nhân viên', minWidth: 180 },
    { field: 'employeeRequestReasonName', title: 'Loại phép', minWidth: 160 },
    { align: 'center', field: 'year', title: 'Năm', width: 80 },
    { align: 'right', field: 'baseDays', title: 'Hạn mức chuẩn', width: 130 },
    { align: 'right', field: 'seniorityDays', title: 'Thâm niên', width: 110 },
    {
      align: 'right',
      field: 'carriedOverDays',
      title: 'Tồn năm trước',
      width: 130,
    },
    {
      align: 'right',
      field: 'adjustmentDays',
      title: 'Điều chỉnh',
      slots: { default: 'adjustmentCell' },
      width: 120,
    },
    {
      align: 'right',
      field: 'totalDays',
      title: 'Tổng hạn mức',
      slots: { default: 'totalCell' },
      width: 130,
    },
    { align: 'right', field: 'usedTime', title: 'Đã dùng', width: 110 },
    {
      align: 'right',
      field: 'remaining',
      title: 'Còn lại',
      slots: { default: 'remainingCell' },
      width: 110,
    },
    {
      align: 'center',
      fixed: 'right',
      title: 'Thao tác',
      slots: { default: 'actions' },
      width: 90,
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, v: Record<string, any>) => {
        const params: EmployeeRequestQuotaApi.ListParams = {
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(v?.keyword ? { keyword: v.keyword } : {}),
          ...(typeof v?.year === 'number' ? { year: v.year } : {}),
          ...(typeof v?.employeeRequestPolicyId === 'number'
            ? { employeeRequestPolicyId: v.employeeRequestPolicyId }
            : {}),
        };
        const r = await getEmployeeRequestQuotaListApi(params);
        const items = r.data ?? [];
        return { items, total: r.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};
const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestQuotaApi.Item>({
  formOptions,
  gridOptions,
});
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestQuotaForm,
});
const [GenerateDrawer, generateDrawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestQuotaGenerateForm,
});
function permitted(allowed: boolean) {
  if (allowed) return true;
  message.warning('Bạn không có quyền thực hiện thao tác này');
  return false;
}
function edit(row: EmployeeRequestQuotaApi.Item) {
  if (!permitted(canUpdate.value)) return;
  drawerApi.setData({ record: row });
  drawerApi.open();
}
async function submit(id: number, p: EmployeeRequestQuotaApi.UpdateInput) {
  if (!permitted(canUpdate.value)) return;
  drawerApi.setState({ confirmLoading: true });
  try {
    const r = await updateEmployeeRequestQuotaApi(id, p);
    if (r.success === false) {
      message.error(r.message ?? 'Cập nhật quyền lợi phép thất bại');
      return;
    }
    message.success('Cập nhật quyền lợi phép thành công');
    drawerApi.close();
    await gridApi.query();
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}
async function openGenerate() {
  if (!permitted(canGenerate.value)) return;
  // Mở sẵn đúng năm HR đang lọc, đỡ phải nhập lại.
  const values = await gridApi.formApi.getValues();
  generateDrawerApi.setData({
    policies: policies.value,
    year: (values?.year as number) ?? currentYear,
  });
  generateDrawerApi.open();
}
async function generate(p: EmployeeRequestQuotaApi.GenerateInput) {
  if (!permitted(canGenerate.value)) return;
  generateDrawerApi.setState({ confirmLoading: true });
  try {
    const r = await generateEmployeeRequestQuotaApi(p);
    if (r.success === false) {
      message.error(r.message ?? 'Cấp quyền lợi phép thất bại');
      return;
    }
    message.success(r.message ?? 'Cấp quyền lợi phép thành công');
    generateDrawerApi.close();
    await gridApi.query();
  } finally {
    generateDrawerApi.setState({ confirmLoading: false });
  }
}
onMounted(loadPolicies);
</script>
<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" :disabled="!canGenerate" @click="openGenerate">
          <template #icon>
            <IconifyIcon icon="lucide:calendar-plus" /> </template
          >Cấp phép theo năm
        </NButton> </template
      ><template #adjustmentCell="{ row }">
        <span
          v-if="row.adjustmentDays !== 0"
          :class="row.adjustmentDays > 0 ? 'text-success' : 'text-destructive'"
          class="tabular-nums"
        >
          {{ row.adjustmentDays > 0 ? '+' : '' }}{{ row.adjustmentDays }}
        </span>
        <span v-else class="text-muted-foreground">0</span> </template
      ><template #totalCell="{ row }">
        <span class="font-medium tabular-nums">{{ row.totalDays }}</span>
        <span class="text-muted-foreground ml-1 text-xs">{{
          row.unit === 'Hour' ? 'giờ' : 'ngày'
        }}</span> </template
      ><template #remainingCell="{ row }">
        <NTag
          :bordered="false"
          :type="row.remaining > 0 ? 'success' : 'warning'"
          size="small"
        >
          {{ row.remaining }}
        </NTag> </template
      ><template #actions="{ row }">
        <NTooltip>
          <template #trigger>
            <NButton
              circle
              quaternary
              size="small"
              :disabled="!canUpdate"
              @click="edit(row)"
            >
              <IconifyIcon icon="lucide:pencil" />
            </NButton> </template
          >Điều chỉnh
        </NTooltip>
      </template>
    </Grid>
    <Drawer @submit="submit" /><GenerateDrawer @submit="generate" />
  </Page>
</template>
