<script lang="ts" setup>
import type { VbenFormProps } from "#/adapter/form";
import type { VxeGridProps } from "#/adapter/vxe-table";
import type { HolidayApi, HolidayTypeOption } from "#/models/hr/holiday";

import { onMounted, ref } from "vue";

import { Page, useVbenDrawer } from "@vben/common-ui";
import { IconifyIcon } from "@vben/icons";
import { formatDate } from "@vben/utils";

import { NButton, NPopconfirm, NSpace, NTag, NTooltip } from "naive-ui";

import { message } from "#/adapter/naive";
import { useVbenVxeGrid } from "#/adapter/vxe-table";
import {
  createHolidayApi,
  deleteHolidayApi,
  getHolidayListApi,
  getHolidayTypeOptionsApi,
} from "#/api";

import HolidayForm from "./HolidayForm.vue";

const DEFAULT_PAGE_SIZE = 10;

const currentEditId = ref<null | string>(null);
const holidayTypes = ref<HolidayTypeOption[]>([]);

function extractHolidayTypes(response: HolidayApi.HolidayTypeResult) {
  let list: HolidayApi.HolidayTypeItem[] = [];

  if (Array.isArray(response)) {
    list = response;
  } else if (Array.isArray(response?.data)) {
    list = response.data;
  } else if (Array.isArray(response?.items)) {
    list = response.items;
  }

  const options: HolidayTypeOption[] = [];

  for (const item of list) {
    const value = item.id ?? item.value ?? item.key ?? item.code;

    if (value === null || value === undefined) {
      continue;
    }

    options.push({
      label: item.name ?? item.label ?? item.title ?? String(value),
      value,
    });
  }

  return options;
}

async function loadHolidayTypes() {
  try {
    holidayTypes.value = extractHolidayTypes(await getHolidayTypeOptionsApi());
  } catch {
    holidayTypes.value = [];
  }
}

function formatHolidayDate(value?: null | string) {
  return value ? formatDate(value, "DD-MM-YYYY") : "-";
}

function formatHolidayDateTime(value?: null | string) {
  return value ? formatDate(value, "DD-MM-YYYY HH:mm:ss") : "-";
}

function getHolidayTypeLabel(type?: null | number | string) {
  if (type === null || type === undefined || type === "") {
    return "-";
  }

  return holidayTypes.value.find((item) => String(item.value) === String(type))?.label ?? "-";
}

function normalizeFormValues(formValues?: Record<string, any>) {
  const keyword = formValues?.keyword?.trim?.();
  const rangeDate = formValues?.rangeDate;
  const startDate = Array.isArray(rangeDate) ? rangeDate[0] : undefined;
  const endDate = Array.isArray(rangeDate) ? rangeDate[1] : undefined;

  return {
    ...(keyword ? { keyword } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: "Input",
      componentProps: {
        placeholder: "Nhập tên hoặc mô tả ngày nghỉ",
      },
      fieldName: "keyword",
      label: "Từ khóa",
    },
    {
      component: "DatePicker",
      componentProps: {
        clearable: true,
        format: "dd-MM-yyyy",
        type: "daterange",
        valueFormat: "yyyy-MM-dd",
      },
      fieldName: "rangeDate",
      label: "Khoảng ngày",
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<HolidayApi.HolidayItem> = {
  border: "full",
  columns: [
    { align: "center", title: "#", type: "seq", width: 60 },
    {
      field: "name",
      minWidth: 160,
      title: "Tên ngày nghỉ",
    },
    {
      field: "type",
      slots: { default: "typeCell" },
      title: "Loại",
      width: 160,
    },
    {
      field: "date",
      formatter: ({ cellValue }: any) => formatHolidayDate(cellValue),
      title: "Ngày",
      width: 140,
    },
    {
      field: "description",
      minWidth: 180,
      title: "Mô tả",
    },
    {
      field: "creationTime",
      formatter: ({ cellValue }: any) => formatHolidayDateTime(cellValue),
      title: "Ngày tạo",
      width: 180,
    },
    {
      align: "center",
      fixed: "right",
      slots: { default: "actions" },
      title: "Hành động",
      width: 100,
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
        const response = await getHolidayListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...normalizeFormValues(formValues),
        });

        return {
          items: response.data ?? response.items ?? [],
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

const [Grid, gridApi] = useVbenVxeGrid<HolidayApi.HolidayItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: HolidayForm,
});

function handleAdd() {
  currentEditId.value = null;
  drawerApi.setData({ holidayTypes: holidayTypes.value, record: null });
  drawerApi.open();
}

async function handleFormSubmit(payload: Record<string, any>) {
  if (currentEditId.value) {
    message.info("Chưa có API cập nhật ngày nghỉ");
  } else {
    await createHolidayApi(payload);
    message.success("Tạo ngày nghỉ thành công");
  }

  drawerApi.close();
  await gridApi.query();
}

async function handleDelete(row: HolidayApi.HolidayItem) {
  if (!row.id) {
    return;
  }

  await deleteHolidayApi(row.id);
  message.success("Xóa ngày nghỉ thành công");
  await gridApi.query();
}

onMounted(loadHolidayTypes);
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

      <template #typeCell="{ row }">
        <NTag :bordered="false" type="info">
          {{ getHolidayTypeLabel(row.holidayType ?? row.type) }}
        </NTag>
      </template>

      <template #actions="{ row }">
        <NSpace justify="center" :size="4">
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
            Bạn có chắc muốn xóa ngày nghỉ này không?
          </NPopconfirm>
        </NSpace>
      </template>
    </Grid>

    <Drawer @submit="handleFormSubmit" />
  </Page>
</template>
