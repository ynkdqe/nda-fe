<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api';

import { computed } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEmployeeByIdApi, getEmployeeListApi } from '#/api';
import { $t } from '#/locales';

import EmployeeForm from './EmployeeForm.vue';

const DEFAULT_PAGE_SIZE = 10;

const EMPLOYEE_PERMISSIONS = {
  create: 'Hrms.Employee.Create',
  delete: 'Hrms.Employee.Delete',
  update: 'Hrms.Employee.Update',
  view: 'Hrms.Employee',
} as const;

const { hasAccessByCodes } = useAccess();

const canCreateEmployee = computed(() =>
  hasAccessByCodes([EMPLOYEE_PERMISSIONS.create]),
);
const canDeleteEmployee = computed(() =>
  hasAccessByCodes([EMPLOYEE_PERMISSIONS.delete]),
);
const canUpdateEmployee = computed(() =>
  hasAccessByCodes([EMPLOYEE_PERMISSIONS.update]),
);
const canViewEmployee = computed(() =>
  hasAccessByCodes([EMPLOYEE_PERMISSIONS.view]),
);

function showNoPermissionMessage() {
  message.warning($t('page.common.noPermissionAction'));
}

const STATUS_TYPE_MAP: Record<
  string,
  'default' | 'error' | 'info' | 'success' | 'warning'
> = {
  'Đang làm': 'success',
  'Luân chuyển nội bộ FRT': 'info',
  'Nghỉ chăm con': 'warning',
  'Nghỉ không lương': 'default',
  'Nghỉ ốm': 'warning',
  'Nghỉ phép năm': 'warning',
  'Nghỉ sinh con khối BO': 'warning',
  'Nghỉ sinh con khối Shop': 'warning',
  'Nghỉ việc': 'error',
  'Tạm khóa user': 'error',
  'Thử việc': 'info',
};

const statusOptions = [
  { label: 'Đang làm', value: 'Đang làm' },
  { label: 'Nghỉ việc', value: 'Nghỉ việc' },
  { label: 'Nghỉ phép năm', value: 'Nghỉ phép năm' },
  { label: 'Nghỉ sinh con khối BO', value: 'Nghỉ sinh con khối BO' },
  { label: 'Nghỉ ốm', value: 'Nghỉ ốm' },
  { label: 'Nghỉ không lương', value: 'Nghỉ không lương' },
  { label: 'Nghỉ chăm con', value: 'Nghỉ chăm con' },
  { label: 'Nghỉ sinh con khối Shop', value: 'Nghỉ sinh con khối Shop' },
  { label: 'Tạm khóa user', value: 'Tạm khóa user' },
  { label: 'Luân chuyển nội bộ FRT', value: 'Luân chuyển nội bộ FRT' },
];

function getStatusLabel(status?: null | string) {
  return status || '-';
}

function getStatusType(status?: null | string) {
  return status ? (STATUS_TYPE_MAP[status] ?? 'default') : 'default';
}

function normalizeFormValues(formValues?: Record<string, any>) {
  const keyword = formValues?.keyword?.trim?.();
  const status = formValues?.status;

  return {
    ...(keyword ? { keyword } : {}),
    ...(status ? { status } : {}),
  };
}

function formatEmployeeDate(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY') : '-';
}

function formatEmployeeDateTime(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY HH:mm:ss') : '-';
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: { content: 'Đặt lại' },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder:
          'Nhập tài khoản, mã nhân viên, họ tên, điện thoại hoặc email',
      },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: statusOptions,
        placeholder: 'Chọn trạng thái',
        style: { minWidth: '180px' },
      },
      fieldName: 'status',
      label: 'Trạng thái',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<EmployeeApi.EmployeeItem> = {
  border: 'full',
  columns: [
    { align: 'center', title: '#', type: 'seq', width: 60 },
    {
      field: 'userName',
      title: 'Tài khoản',
      width: 120,
    },
    {
      field: 'employeeCode',
      title: 'Mã nhân viên',
      width: 105,
    },
    {
      field: 'name',
      minWidth: 180,
      title: 'Họ tên',
    },
    {
      field: 'phone',
      title: 'Điện thoại',
      width: 140,
    },
    {
      field: 'email',
      title: 'Email',
      width: 200,
    },
    {
      field: 'status',
      slots: { default: 'statusCell' },
      title: 'Trạng thái',
      width: 180,
    },
    {
      field: 'birthDate',
      formatter: ({ cellValue }: any) => formatEmployeeDate(cellValue),
      title: 'Ngày sinh',
      width: 140,
    },
    {
      field: 'enrollDate',
      formatter: ({ cellValue }: any) => formatEmployeeDate(cellValue),
      title: 'Ngày vào làm',
      width: 160,
    },
    {
      field: 'resignationDate',
      formatter: ({ cellValue }: any) => formatEmployeeDate(cellValue),
      title: 'Ngày nghỉ việc',
      width: 160,
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }: any) => formatEmployeeDateTime(cellValue),
      title: 'Ngày tạo',
      width: 170,
    },
    {
      field: 'modificationTime',
      formatter: ({ cellValue }: any) => formatEmployeeDateTime(cellValue),
      title: 'Ngày chỉnh sửa',
      width: 170,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: 'Hành động',
      width: 120,
    },
  ],
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await getEmployeeListApi({
          current: page.currentPage,
          pageSize: page.pageSize,
          ...normalizeFormValues(formValues),
        });

        return {
          items: response.data ?? [],
          total: response.total ?? 0,
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
    // @ts-ignore search is an extended Vben toolbar config option.
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<EmployeeApi.EmployeeItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: EmployeeForm,
});

function openCreate() {
  if (!canCreateEmployee.value) {
    showNoPermissionMessage();
    return;
  }

  drawerApi.setData({ record: null });
  drawerApi.open();
}

async function onEdit(row: EmployeeApi.EmployeeItem) {
  if (!canUpdateEmployee.value) {
    showNoPermissionMessage();
    return;
  }

  try {
    const response = await getEmployeeByIdApi(row.id);
    if (!response.data) {
      message.error(response.message ?? 'Không tìm thấy nhân viên');
      return;
    }

    drawerApi.setData({ record: response.data });
    drawerApi.open();
  } catch {
    message.error(
      `Không thể tải thông tin nhân viên: ${row?.name || row?.userName || ''}`,
    );
  }
}

function onDelete(row: EmployeeApi.EmployeeItem) {
  if (!canDeleteEmployee.value) {
    showNoPermissionMessage();
    return;
  }

  message.info(
    `Chưa có API xóa nhân viên: ${row?.name || row?.userName || ''}`,
  );
}

function onDetail(row: EmployeeApi.EmployeeItem) {
  if (!canViewEmployee.value) {
    showNoPermissionMessage();
    return;
  }

  message.info(`Chi tiết nhân viên: ${row?.name || row?.userName || ''}`);
}

function onFormSubmit(_formData: Record<string, any>) {
  gridApi.query();
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton
          type="primary"
          :disabled="!canCreateEmployee"
          @click="openCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm mới
        </NButton>
      </template>

      <template #statusCell="{ row }">
        <NTag :bordered="false" :type="getStatusType(row.status)">
          {{ getStatusLabel(row.status) }}
        </NTag>
      </template>

      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="primary"
                :disabled="!canUpdateEmployee"
                @click="onEdit(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:pencil" />
                </template>
              </NButton>
            </template>
            Sửa
          </NTooltip>

          <NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
            @positive-click="() => onDelete(row)"
          >
            <template #trigger>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    circle
                    quaternary
                    size="small"
                    type="error"
                    :disabled="!canDeleteEmployee"
                  >
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa
              </NTooltip>
            </template>
            Xác nhận xóa nhân viên này?
          </NPopconfirm>

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="info"
                :disabled="!canViewEmployee"
                @click="onDetail(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:eye" />
                </template>
              </NButton>
            </template>
            Chi tiết
          </NTooltip>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="onFormSubmit" />
  </Page>
</template>
