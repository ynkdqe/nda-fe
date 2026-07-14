<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  ContractApi,
  ContractSelectOption,
  ContractTypeItem,
} from '#/models/hr/contract';

import { onMounted, ref, watch } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createContractApi,
  deleteContractApi,
  getContractByIdApi,
  getContractListApi,
  getContractStatusOptionsApi,
  getContractTypeListApi,
  updateContractApi,
} from '#/api';

import ContractForm from './ContractForm.vue';

type SelectOption = ContractSelectOption;

const DEFAULT_PAGE_SIZE = 10;

const statusOptions = ref<SelectOption[]>([]);
const statusMap = ref<Record<string, string>>({});
const contractTypes = ref<SelectOption[]>([]);
const contractTypeList = ref<ContractTypeItem[]>([]);
const currentRecord = ref<ContractApi.ContractItem | null>(null);

function extractOptions(
  response: ContractApi.ContractOptionResult,
): SelectOption[] {
  let list: ContractApi.ContractOptionItem[] = [];

  if (Array.isArray(response)) {
    list = response;
  } else if (Array.isArray(response?.data)) {
    list = response.data;
  } else if (Array.isArray(response?.items)) {
    list = response.items;
  }

  return list.map((item: ContractApi.ContractOptionItem) => ({
    label: item.name ?? String(item.id),
    value: item.id,
  }));
}

async function loadStatuses() {
  try {
    const options = extractOptions(await getContractStatusOptionsApi());
    statusOptions.value = options;
    const nextStatusMap: Record<string, string> = {};
    for (const option of options) {
      nextStatusMap[String(option.value)] = option.label;
    }
    statusMap.value = nextStatusMap;
  } catch {
    statusOptions.value = [];
    statusMap.value = {};
  }
}

function mapContractTypeOptions(list: ContractTypeItem[]): SelectOption[] {
  return list.map((item) => ({
    label: item.name ?? String(item.id),
    value: item.id,
  }));
}

async function loadContractTypes() {
  try {
    const response = await getContractTypeListApi({
      page: 1,
      pageSize: 1000,
    });
    const list = response.data ?? [];

    contractTypeList.value = list;
    contractTypes.value = mapContractTypeOptions(list);
  } catch {
    contractTypeList.value = [];
    contractTypes.value = [];
  }
}

function numberFormatter(value?: null | number | string) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatContractDate(value?: null | number | string) {
  return value ? formatDate(value, 'DD-MM-YYYY') : '-';
}

function getStatusLabel(status?: null | number | string) {
  if (status === null || status === undefined || status === '') {
    return '-';
  }

  return statusMap.value[String(status)] || String(status);
}

function getStatusType(status?: null | number | string) {
  const value = Number(status);

  if (value === 1) {
    return 'success';
  }

  if (value === 0) {
    return 'error';
  }

  return 'default';
}



function toApiDate(value?: null | number | string) {
  return value ? formatDate(value, 'YYYY-MM-DD') : undefined;
}

function normalizeFormValues(formValues?: Record<string, any>) {
  const keyword = formValues?.keyword?.trim?.();
  const effective = formValues?.effective;
  const effectiveStart = Array.isArray(effective)
    ? toApiDate(effective[0])
    : undefined;
  const effectiveEnd = Array.isArray(effective)
    ? toApiDate(effective[1])
    : undefined;
  const status = Array.isArray(formValues?.status)
    ? formValues.status.join(',')
    : formValues?.status;

  return {
    ...(keyword ? { keyword } : {}),
    ...(status !== null && status !== undefined && status !== ''
      ? { status }
      : {}),
    ...(formValues?.contractType
      ? { contractType: formValues.contractType }
      : {}),
    ...(formValues?.isActive !== null && formValues?.isActive !== undefined
      ? { isActive: formValues.isActive }
      : {}),
    ...(effectiveStart ? { effectiveStart } : {}),
    ...(effectiveEnd ? { effectiveEnd } : {}),
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  resetButtonOptions: { content: 'Đặt lại' },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập mã hợp đồng, tên hợp đồng hoặc nhân viên',
      },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        multiple: true,
        options: [],
        placeholder: 'Chọn trạng thái',
        style: { minWidth: '180px' },
      },
      fieldName: 'status',
      label: 'Trạng thái',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
        placeholder: 'Chọn loại hợp đồng',
        style: { minWidth: '180px' },
      },
      fieldName: 'contractType',
      label: 'Loại HĐ',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'effective',
      label: 'Hiệu lực',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: 'Hiệu lực', value: 1 },
          { label: 'Hết hạn', value: 0 },
        ],
        placeholder: 'Hiệu lực',
        style: { minWidth: '120px' },
      },
      fieldName: 'isActive',
      label: 'Hiệu lực',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<ContractApi.ContractItem> = {
  border: 'full',
  columns: [
    { align: 'center', title: '#', type: 'seq', width: 60 },
    {
      field: 'contractCode',
      title: 'Mã HĐ',
      width: 160,
    },
    {
      field: 'contractName',
      formatter: ({ row }: any) => String(row?.contractName ?? row?.name ?? ''),
      minWidth: 180,
      title: 'Tên HĐ',
    },
    {
      field: 'employee.name',
      formatter: ({ row }: any) =>
        String(row?.employee?.name ?? row?.employeeName ?? ''),
      minWidth: 180,
      title: 'Tên nhân viên',
    },
    {
      field: 'employee.employeeCode',
      formatter: ({ row }: any) =>
        String(
          row?.employee?.employeeCode ??
            row?.employeeCode ??
            row?.employee?.userName ??
            '',
        ),
      title: 'Mã nhân viên',
      width: 140,
    },
    {
      field: 'effectiveDate',
      formatter: ({ cellValue }: any) => formatContractDate(cellValue),
      title: 'Hiệu lực',
      width: 120,
    },
    {
      field: 'expiryDate',
      formatter: ({ cellValue }: any) => formatContractDate(cellValue),
      title: 'Hết hạn',
      width: 120,
    },
    {
      field: 'salaryGross',
      formatter: ({ row }: any) =>
        numberFormatter(row?.salaryGross ?? row?.totalSalary),
      title: 'Lương gross',
      width: 140,
    },
    {
      field: 'totalCost',
      formatter: ({ row }: any) => numberFormatter(row?.totalCost),
      title: 'Chi phí hợp đồng',
      width: 160,
    },
    {
      field: 'status',
      slots: { default: 'statusCell' },
      title: 'Trạng thái',
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
  pagerConfig: {
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: Record<string, any>) => {
        const response = await getContractListApi({
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

const [Grid, gridApi] = useVbenVxeGrid<ContractApi.ContractItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: ContractForm,
});

function syncFormSelectOptions() {
  const current = (gridApi.formApi as any).getState?.();
  const schema = (current?.schema || []).map((item: any) => {
    if (item.fieldName === 'status') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: statusOptions.value,
        },
      };
    }

    if (item.fieldName === 'contractType') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: contractTypes.value,
        },
      };
    }

    return item;
  });

  (gridApi.formApi as any).setState?.({ schema });
}

function openCreate() {
  currentRecord.value = null;
  drawerApi.setData({
    contractTypeList: contractTypeList.value,
    contractTypes: contractTypes.value,
    record: null,
    statusOptions: statusOptions.value,
  });
  drawerApi.open();
}

async function onEdit(row: ContractApi.ContractItem) {
  if (!row.id) {
    return;
  }

  const response = await getContractByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy hợp đồng');
    return;
  }

  const record = response.data;
  currentRecord.value = record;
  drawerApi.setData({
    contractTypeList: contractTypeList.value,
    contractTypes: contractTypes.value,
    record,
    statusOptions: statusOptions.value,
  });
  drawerApi.open();
}

async function onDelete(row: ContractApi.ContractItem) {
  if (!row.id) {
    return;
  }

  await deleteContractApi(row.id);
  message.success('Xóa hợp đồng thành công');
  await gridApi.query();
}

async function onFormSubmit(formData: Record<string, any>) {
  const id = currentRecord.value?.id;

  if (id) {
    await updateContractApi(id, formData);
    message.success('Cập nhật hợp đồng thành công');
  } else {
    await createContractApi(formData);
    message.success('Tạo hợp đồng thành công');
  }

  drawerApi.close();
  await gridApi.query();
}

watch([statusOptions, contractTypes], () => syncFormSelectOptions());

onMounted(async () => {
  await Promise.all([loadStatuses(), loadContractTypes()]);
  syncFormSelectOptions();
});
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="openCreate">
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
                  <NButton circle quaternary size="small" type="error">
                    <template #icon>
                      <IconifyIcon class="size-4" icon="lucide:trash-2" />
                    </template>
                  </NButton>
                </template>
                Xóa
              </NTooltip>
            </template>
            Bạn có chắc muốn xóa hợp đồng này không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="onFormSubmit" />
  </Page>
</template>
