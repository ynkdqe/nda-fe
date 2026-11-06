<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { FaceAttendanceApi } from '#/models/hr/face-attendance';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { formatDate } from '@vben/utils';

import { NButton, NImage, NPopconfirm, NSpace, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteEmployeeFaceApi, getFaceEmployeeListApi } from '#/api';
import { FACE_ATTENDANCE_PERMISSIONS } from '#/constants/face-attendance';

import FaceIdDetail from './FaceIdDetail.vue';

const DEFAULT_PAGE_SIZE = 20;

const { hasAccessByCodes } = useAccess();
const canDelete = computed(() =>
  hasAccessByCodes([FACE_ATTENDANCE_PERMISSIONS.delete]),
);
const deletingId = ref<null | number>(null);

function t(key: string, args?: string[]) {
  const fullKey = `page.hr.faceIdPage.${key}`;
  return args ? $t(fullKey, args) : $t(fullKey);
}

function formatDateTime(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY HH:mm') : '-';
}

function normalizeFormValues(formValues?: Record<string, any>) {
  const keyword = formValues?.keyword?.trim?.();
  const status = formValues?.status;
  return {
    ...(keyword ? { keyword } : {}),
    ...(status === 'enrolled' || status === 'notEnrolled' ? { status } : {}),
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: t('filters.keywordPlaceholder') },
      fieldName: 'keyword',
      label: t('filters.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: t('enrolled'), value: 'enrolled' },
          { label: t('notEnrolled'), value: 'notEnrolled' },
        ],
        placeholder: t('filters.statusPlaceholder'),
        style: { minWidth: '180px' },
      },
      fieldName: 'status',
      label: t('columns.status'),
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<FaceAttendanceApi.EmployeeFaceItem> = {
  border: 'full',
  columns: [
    { align: 'center', title: '#', type: 'seq', width: 60 },
    {
      align: 'center',
      field: 'imageUrl',
      slots: { default: 'imageCell' },
      title: t('columns.image'),
      width: 80,
    },
    { field: 'employeeCode', title: t('columns.employeeCode'), width: 120 },
    { field: 'employeeName', minWidth: 180, title: t('columns.employeeName') },
    { field: 'userName', minWidth: 140, title: t('columns.userName') },
    {
      align: 'center',
      field: 'enrolled',
      slots: { default: 'statusCell' },
      title: t('columns.status'),
      width: 130,
    },
    {
      field: 'enrolledAt',
      formatter: ({ cellValue }: any) => formatDateTime(cellValue),
      title: t('columns.enrolledAt'),
      width: 150,
    },
    {
      align: 'center',
      field: 'selfEnrolled',
      slots: { default: 'enrolledByCell' },
      title: t('columns.enrolledBy'),
      width: 130,
    },
    {
      field: 'lastCheckInTime',
      formatter: ({ cellValue }: any) => formatDateTime(cellValue),
      title: t('columns.lastCheckIn'),
      width: 150,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: t('columns.actions'),
      width: 110,
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
        const response = await getFaceEmployeeListApi({
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
  rowConfig: { keyField: 'employeeId' },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: {
    custom: true,
    // @ts-expect-error search is an extended Vben toolbar config option.
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<FaceAttendanceApi.EmployeeFaceItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: FaceIdDetail,
});

function openDetail(row: FaceAttendanceApi.EmployeeFaceItem) {
  drawerApi.setData({ employeeId: row.employeeId });
  drawerApi.open();
}

async function handleDelete(row: FaceAttendanceApi.EmployeeFaceItem) {
  if (!canDelete.value) {
    message.warning($t('page.common.noPermissionAction'));
    return;
  }
  if (deletingId.value !== null) return;
  deletingId.value = row.employeeId;
  try {
    await deleteEmployeeFaceApi(row.employeeId);
    message.success(t('deleteSuccess'));
    await gridApi.query();
  } catch {
    // Interceptor đã hiển thị lỗi.
  } finally {
    deletingId.value = null;
  }
}

async function handleChanged() {
  await gridApi.query();
}
</script>

<template>
  <Page>
    <Grid>
      <template #imageCell="{ row }">
        <NImage
          v-if="row.imageUrl"
          :src="row.imageUrl"
          :alt="row.employeeName ?? ''"
          object-fit="cover"
          width="36"
          height="48"
          class="face-id-thumb"
        />
        <IconifyIcon v-else icon="lucide:scan-face" class="size-6 opacity-40" />
      </template>

      <template #statusCell="{ row }">
        <NTag
          :bordered="false"
          size="small"
          :type="row.enrolled ? 'success' : 'default'"
        >
          {{ row.enrolled ? t('enrolled') : t('notEnrolled') }}
        </NTag>
      </template>

      <template #enrolledByCell="{ row }">
        <span v-if="row.selfEnrolled === null">-</span>
        <NTag
          v-else
          :bordered="false"
          size="small"
          :type="row.selfEnrolled ? 'info' : 'warning'"
        >
          {{ row.selfEnrolled ? t('selfEnrolled') : t('hrEnrolled') }}
        </NTag>
      </template>

      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip trigger="hover">
            <template #trigger>
              <NButton circle quaternary size="small" @click="openDetail(row)">
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:eye" />
                </template>
              </NButton>
            </template>
            {{ t('view') }}
          </NTooltip>
          <NPopconfirm
            v-if="row.enrolled"
            :negative-text="t('cancel')"
            :positive-text="t('delete')"
            @positive-click="() => handleDelete(row)"
          >
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="error"
                :disabled="!canDelete || deletingId !== null"
                :loading="deletingId === row.employeeId"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:trash-2" />
                </template>
              </NButton>
            </template>
            {{ t('deleteConfirm', [row.employeeName ?? '']) }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @changed="handleChanged" />
  </Page>
</template>

<style scoped>
.face-id-thumb :deep(img) {
  border-radius: 4px;
}
</style>
