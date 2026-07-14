<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ContractTypeApi } from '#/models/hr/contract-type';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NPopconfirm, NSpace, NSwitch, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createContractTypeApi,
  deleteContractTypeApi,
  getContractTypeByIdApi,
  getContractTypeListApi,
  updateContractTypeApi,
  updateContractTypeDurationsApi,
} from '#/api';

import ContractTypeForm from './ContractTypeForm.vue';
import DurationsModal from './DurationsModal.vue';

const DEFAULT_PAGE_SIZE = 10;

function numberFormatter(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const normalized = String(value).replaceAll(',', '');
  const numberValue = Number(normalized);

  if (Number.isNaN(numberValue)) {
    return '-';
  }

  return normalized.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
}

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
        placeholder: 'Nhập mã hoặc tên loại hợp đồng',
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

const gridOptions: VxeGridProps<ContractTypeApi.ContractTypeItem> = {
  border: 'full',
  columns: [
    { align: 'center', title: '#', type: 'seq', width: 60 },
    {
      field: 'code',
      title: 'Mã',
      width: 140,
    },
    {
      field: 'name',
      minWidth: 220,
      title: 'Tên loại hợp đồng',
    },
    {
      field: 'hasSocialInsurance',
      slots: { default: 'hasSICell' },
      title: 'Đóng BHXH',
      width: 120,
    },
    {
      field: 'isTaxFixed',
      slots: { default: 'isTaxFixedCell' },
      title: 'Thuế cố định',
      width: 120,
    },
    {
      field: 'taxPercent',
      title: 'Thuế (%)',
      width: 120,
    },
    {
      field: 'employeeSocialInsurancePercent',
      title: 'BHXH NV (%)',
      width: 150,
    },
    {
      field: 'employeeHealthInsurancePercent',
      title: 'BHYT NV (%)',
      width: 150,
    },
    {
      field: 'employeeUnemployeeInsurancePercent',
      title: 'BHTN NV (%)',
      width: 150,
    },
    {
      field: 'minInsuranceSalary',
      formatter: ({ cellValue }: any) => numberFormatter(cellValue),
      title: 'Lương BH tối thiểu',
      width: 170,
    },
    {
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
      title: 'Hành động',
      width: 140,
    },
  ],
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await getContractTypeListApi({
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

const [Grid, gridApi] = useVbenVxeGrid<ContractTypeApi.ContractTypeItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: ContractTypeForm,
});

const [Modal, modalApi] = useVbenModal({
  connectedComponent: DurationsModal,
});

function handleAdd() {
  drawerApi.setData({ record: null });
  drawerApi.open();
}

async function handleEdit(row: ContractTypeApi.ContractTypeItem) {
  const response = await getContractTypeByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy loại hợp đồng');
    return;
  }

  drawerApi.setData({ record: response.data });
  drawerApi.open();
}

function openDurationsModal(row: ContractTypeApi.ContractTypeItem) {
  modalApi.setData({ record: row });
  modalApi.open();
}

async function handleFormSubmit(payload: Record<string, any>) {
  if (payload?.id) {
    await updateContractTypeApi(payload.id, payload);
    message.success('Cập nhật loại hợp đồng thành công');
  } else {
    await createContractTypeApi(payload);
    message.success('Tạo loại hợp đồng thành công');
  }

  drawerApi.close();
  await gridApi.query();
}

async function handleDurationSubmit(data: {
  contractTypeId: number | string;
  durations: ContractTypeApi.DurationItem[];
}) {
  await updateContractTypeDurationsApi(data.contractTypeId, data.durations);
  message.success('Lưu thời hạn hợp đồng thành công');
  modalApi.close();
  await gridApi.query();
}

async function onDelete(row: ContractTypeApi.ContractTypeItem) {
  if (!row.id) {
    return;
  }

  await deleteContractTypeApi(row.id);
  message.success('Xóa loại hợp đồng thành công');
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

      <template #hasSICell="{ row }">
        <NSwitch :value="!!row.hasSocialInsurance" disabled size="small" />
      </template>

      <template #isTaxFixedCell="{ row }">
        <NSwitch :value="!!row.isTaxFixed" disabled size="small" />
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

          <NTooltip trigger="hover">
            <template #trigger>
              <NButton
                circle
                quaternary
                size="small"
                type="info"
                @click="openDurationsModal(row)"
              >
                <template #icon>
                  <IconifyIcon class="size-4" icon="lucide:clock" />
                </template>
              </NButton>
            </template>
            Thời hạn
          </NTooltip>

          <NPopconfirm
            negative-text="Hủy"
            positive-text="Xóa"
            @positive-click="() => onDelete(row)"
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
            Bạn có chắc muốn xóa loại hợp đồng này không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="handleFormSubmit" />
    <Modal @submit="handleDurationSubmit" />
  </Page>
</template>
