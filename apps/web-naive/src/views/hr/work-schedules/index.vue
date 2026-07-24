<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { WorkScheduleApi } from '#/models/hr/work-schedule';

import { computed, markRaw } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { NButton, NPopconfirm, NSpace, NSwitch, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkScheduleApi,
  deleteWorkScheduleApi,
  getWorkScheduleListApi,
  updateWorkScheduleApi,
} from '#/api';
import EmployeeSearchSelect from '#/components/EmployeeSearchSelect.vue';
import { $t } from '#/locales';

import WorkScheduleForm from './WorkScheduleForm.vue';

const DEFAULT_PAGE_SIZE = 10;

const WORK_SCHEDULE_PERMISSIONS = {
  create: 'Hrms.WorkSchedule.Create',
  delete: 'Hrms.WorkSchedule.Delete',
  update: 'Hrms.WorkSchedule.Update',
  view: 'Hrms.WorkSchedule',
} as const;

const { hasAccessByCodes } = useAccess();

const canCreateWorkSchedule = computed(() =>
  hasAccessByCodes([WORK_SCHEDULE_PERMISSIONS.create]),
);
const canDeleteWorkSchedule = computed(() =>
  hasAccessByCodes([WORK_SCHEDULE_PERMISSIONS.delete]),
);
const canUpdateWorkSchedule = computed(() =>
  hasAccessByCodes([WORK_SCHEDULE_PERMISSIONS.update]),
);

function showNoPermissionMessage() {
  message.warning($t('page.common.noPermissionAction'));
}

function formatScheduleDate(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY') : '-';
}

function normalizeEmployeeIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return ids.length > 0 ? ids : undefined;
}

function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return formatDateToYmd(value);
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : formatDateToYmd(date);
  }

  if (typeof value === 'string') {
    const ymdMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (ymdMatch) {
      return ymdMatch[0];
    }

    const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : formatDateToYmd(date);
  }

  return undefined;
}

function normalizeFormValues(formValues?: Record<string, any>) {
  const ids = normalizeEmployeeIds(formValues?.ids ?? formValues?.employeeIds);
  const dateRange = formValues?.dateRange;
  const startDate = Array.isArray(dateRange)
    ? normalizeDate(dateRange[0])
    : undefined;
  const endDate = Array.isArray(dateRange)
    ? normalizeDate(dateRange[1])
    : undefined;

  return {
    ...(ids ? { ids } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: markRaw(EmployeeSearchSelect),
      componentProps: {
        mode: 'multiple',
        placeholder: 'Chọn nhân viên',
        style: { minWidth: '240px' },
      },
      fieldName: 'ids',
      label: 'Nhân viên',
      modelPropName: 'modelValue',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'dateRange',
      label: 'Ngày',
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<WorkScheduleApi.WorkScheduleItem> = {
  border: 'full',
  checkboxConfig: {
    highlight: true,
    labelField: 'employee',
  },
  columns: [
    { title: '#', type: 'seq', width: 50 },
    {
      field: 'date',
      formatter: ({ cellValue }: any) => formatScheduleDate(cellValue),
      title: 'Ngày',
      width: 140,
    },
    {
      field: 'employee',
      minWidth: 180,
      title: 'Nhân viên',
    },
    {
      field: 'isApplyAll',
      slots: { default: 'applyAllCell' },
      title: 'Áp dụng tất cả',
      width: 140,
    },
    {
      field: 'workshift',
      minWidth: 220,
      title: 'Ca làm việc',
    },
    {
      field: 'description',
      minWidth: 180,
      title: 'Mô tả',
    },
    {
      field: 'source',
      title: 'Nguồn',
      width: 140,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: 'Hành động',
      width: 140,
    },
  ],
  keepSource: true,
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await getWorkScheduleListApi({
          page: page.currentPage,
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

const [Grid, gridApi] = useVbenVxeGrid<WorkScheduleApi.WorkScheduleItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: WorkScheduleForm,
});

function handleAdd() {
  if (!canCreateWorkSchedule.value) {
    showNoPermissionMessage();
    return;
  }

  drawerApi.setData({ record: null });
  drawerApi.open();
}

function handleEdit(row: WorkScheduleApi.WorkScheduleItem) {
  if (!canUpdateWorkSchedule.value) {
    showNoPermissionMessage();
    return;
  }

  drawerApi.setData({ record: row });
  drawerApi.open();
}

async function handleDelete(row: WorkScheduleApi.WorkScheduleItem) {
  if (!canDeleteWorkSchedule.value) {
    showNoPermissionMessage();
    return;
  }

  if (!row.id) {
    return;
  }

  await deleteWorkScheduleApi(row.id);
  message.success('Xóa lịch làm việc thành công');
  await gridApi.query();
}

async function handleFormSubmit(
  payload: Record<string, any>,
  original?: null | WorkScheduleApi.WorkScheduleItem,
) {
  if (original?.id && !canUpdateWorkSchedule.value) {
    showNoPermissionMessage();
    return;
  }

  if (!original?.id && !canCreateWorkSchedule.value) {
    showNoPermissionMessage();
    return;
  }

  if (original?.id) {
    await updateWorkScheduleApi(original.id, payload);
    message.success('Cập nhật lịch làm việc thành công');
  } else {
    await createWorkScheduleApi(payload);
    message.success('Tạo lịch làm việc thành công');
  }

  drawerApi.close();
  await gridApi.query();
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton
          type="primary"
          :disabled="!canCreateWorkSchedule"
          @click="handleAdd"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm mới
        </NButton>
      </template>

      <template #applyAllCell="{ row }">
        <NSwitch :value="!!row.isApplyAll" disabled size="small" />
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
                :disabled="!canUpdateWorkSchedule"
                @click="handleEdit(row)"
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
            @positive-click="() => handleDelete(row)"
          >
            <template #trigger>
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    circle
                    quaternary
                    size="small"
                    type="error"
                    :disabled="!canDeleteWorkSchedule"
                  >
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa
              </NTooltip>
            </template>
            Bạn có chắc muốn xóa lịch làm việc này không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="handleFormSubmit" />
  </Page>
</template>
