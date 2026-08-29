<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TimesheetCutoffApi } from '#/models/hr/timesheet-cutoff';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTimesheetCutoffApi,
  deleteTimesheetCutoffApi,
  getTimesheetCutoffByIdApi,
  getTimesheetCutoffListApi,
  updateTimesheetCutoffApi,
} from '#/api';
import { formatDateOnly } from '#/utils/date';

import TimesheetCutoffForm from './TimesheetCutoffForm.vue';

const deletingId = ref<null | number>(null);

const gridOptions: VxeGridProps<TimesheetCutoffApi.Item> = {
  border: 'full',
  columns: [
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    {
      align: 'center',
      field: 'period',
      title: 'Kỳ công',
      width: 140,
      slots: { default: 'periodCell' },
    },
    {
      field: 'cutoffDate',
      title: 'Ngày chốt',
      width: 160,
      slots: { default: 'cutoffCell' },
    },
    { field: 'note', title: 'Ghi chú', minWidth: 260 },
    {
      align: 'center',
      fixed: 'right',
      title: 'Thao tác',
      width: 120,
      slots: { default: 'actions' },
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any) => {
        const response = await getTimesheetCutoffListApi({
          current: page.currentPage,
          pageSize: page.pageSize,
        });
        const items = (response.data ?? []).filter((x) => !x.isDeleted);
        // Kỳ gần nhất lên đầu cho dễ theo dõi.
        const sorted = [...items].sort(
          (a, b) => b.year - a.year || b.month - a.month,
        );
        return { items: sorted, total: response.total ?? sorted.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};

const [Grid, gridApi] = useVbenVxeGrid<TimesheetCutoffApi.Item>({
  gridOptions,
});
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: TimesheetCutoffForm,
});

function add() {
  drawerApi.setData({ record: null });
  drawerApi.open();
}

async function edit(row: TimesheetCutoffApi.Item) {
  const response = await getTimesheetCutoffByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy cấu hình');
    return;
  }

  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

async function submit(
  payload: TimesheetCutoffApi.CreateInput | TimesheetCutoffApi.UpdateInput,
) {
  drawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in payload) {
      await updateTimesheetCutoffApi(payload.id, payload);
      message.success('Cập nhật ngày chốt công thành công');
    } else {
      await createTimesheetCutoffApi(payload);
      message.success('Thêm ngày chốt công thành công');
    }
    drawerApi.close();
    await gridApi.query();
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}

async function remove(row: TimesheetCutoffApi.Item) {
  if (deletingId.value !== null) {
    return;
  }

  deletingId.value = row.id;
  try {
    await deleteTimesheetCutoffApi(row.id);
    message.success('Xóa ngày chốt công thành công');
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
        <NButton type="primary" @click="add">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          Thêm mới
        </NButton>
      </template>

      <template #periodCell="{ row }">
        {{ String(row.month).padStart(2, '0') }}/{{ row.year }}
      </template>

      <template #cutoffCell="{ row }">
        {{ formatDateOnly(row.cutoffDate) }}
      </template>

      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
          <NTooltip>
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="primary"
                @click="edit(row)"
              >
                <template #icon><IconifyIcon icon="lucide:pencil" /></template>
              </NButton>
            </template>
            Sửa
          </NTooltip>

          <NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
            @positive-click="() => remove(row)"
          >
            <template #trigger>
              <NTooltip>
                <template #trigger>
                  <NButton
                    circle
                    :disabled="deletingId !== null"
                    :loading="deletingId === row.id"
                    quaternary
                    size="small"
                    type="error"
                  >
                    <template #icon>
                      <IconifyIcon icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa
              </NTooltip>
            </template>
            Xóa cấu hình ngày chốt cho kỳ
            {{ String(row.month).padStart(2, '0') }}/{{ row.year }}?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="submit" />
  </Page>
</template>
