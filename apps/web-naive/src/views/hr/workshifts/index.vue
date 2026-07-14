<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { WorkShiftApi } from '#/models/hr/workshift';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NSwitch, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createWorkShiftApi,
  deleteWorkShiftApi,
  getWorkShiftByIdApi,
  getWorkShiftListApi,
  updateWorkShiftApi,
} from '#/api';

import WorkShiftForm from './WorkShiftForm.vue';

const DEFAULT_PAGE_SIZE = 10;

const currentEditId = ref<null | number | string>(null);

function normalizeFormValues(formValues?: Record<string, any>) {
  const keyword = formValues?.keyword?.trim?.();

  return {
    ...(keyword ? { keyword } : {}),
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: { content: 'Đặt lại' },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập mã hoặc tên ca làm việc',
      },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<WorkShiftApi.WorkShiftItem> = {
  border: 'full',
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { align: 'center', title: '#', type: 'seq', width: 50 },
    {
      field: 'code',
      minWidth: 140,
      title: 'Mã ca',
    },
    {
      field: 'name',
      minWidth: 180,
      title: 'Tên ca',
    },
    {
      field: 'fromTime',
      title: 'Giờ bắt đầu',
      width: 130,
    },
    {
      field: 'toTime',
      title: 'Giờ kết thúc',
      width: 130,
    },
    {
      field: 'workHours',
      title: 'Số giờ làm việc',
      width: 140,
    },
    {
      field: 'workPoint',
      title: 'Điểm',
      width: 100,
    },
    {
      field: 'isDefault',
      slots: { default: 'isDefaultCell' },
      title: 'Ca mặc định',
      width: 120,
    },
    {
      field: 'overShift',
      slots: { default: 'overShiftCell' },
      title: 'Qua ngày',
      width: 110,
    },
    {
      field: 'hasBreak',
      slots: { default: 'hasBreakCell' },
      title: 'Có nghỉ giữa ca',
      width: 140,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: 'Hành động',
      width: 120,
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
        const response = await getWorkShiftListApi({
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

const [Grid, gridApi] = useVbenVxeGrid<WorkShiftApi.WorkShiftItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: WorkShiftForm,
});

function handleAdd() {
  currentEditId.value = null;
  drawerApi.setData({ record: null });
  drawerApi.open();
}

async function handleEdit(row: WorkShiftApi.WorkShiftItem) {
  const response = await getWorkShiftByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy ca làm việc');
    return;
  }

  currentEditId.value = row.id;
  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

async function handleDelete(row: WorkShiftApi.WorkShiftItem) {
  if (!row.id) {
    return;
  }

  await deleteWorkShiftApi(row.id);
  message.success('Xóa ca làm việc thành công');
  await gridApi.query();
}

async function handleFormSubmit(payload: Record<string, any>) {
  if (currentEditId.value) {
    await updateWorkShiftApi(currentEditId.value, payload);
    message.success('Cập nhật ca làm việc thành công');
  } else {
    await createWorkShiftApi(payload);
    message.success('Tạo ca làm việc thành công');
  }

  drawerApi.close();
  await gridApi.query();
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm mới
        </NButton>
      </template>

      <template #overShiftCell="{ row }">
        <NSwitch :value="!!row.overShift" disabled size="small" />
      </template>

      <template #hasBreakCell="{ row }">
        <NSwitch :value="!!row.hasBreak" disabled size="small" />
      </template>

      <template #isDefaultCell="{ row }">
        <NSwitch :value="!!row.isDefault" disabled size="small" />
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
                  <NButton circle quaternary size="small" type="error">
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa
              </NTooltip>
            </template>
            Bạn có chắc muốn xóa ca làm việc này không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="handleFormSubmit" />
  </Page>
</template>
