<script lang="ts" setup>
import type {
  WorkScheduleApi,
  WorkScheduleFormRecord,
  WorkScheduleSelectOption,
} from "#/models/hr/work-schedule";
import type { WorkShiftApi } from "#/models/hr/workshift";

import { computed, defineComponent, h, markRaw, onMounted, reactive } from "vue";

import { useVbenDrawer } from "@vben/common-ui";

import { NSwitch } from "naive-ui";

import { useVbenForm } from "#/adapter/form";
import { message } from "#/adapter/naive";
import { getWorkShiftListApi } from "#/api";
import EmployeeSearchSelect from "#/components/EmployeeSearchSelect.vue";

const emit = defineEmits<{
  submit: [Record<string, any>, null | WorkScheduleApi.WorkScheduleItem];
}>();

const workshiftOptions = reactive<WorkScheduleSelectOption[]>([]);
const DATE_RANGE_WARNING = "Đến ngày phải lớn hơn hoặc bằng Từ ngày";

const InlineSwitch = defineComponent({
  name: "InlineSwitch",
  props: {
    checked: Boolean,
    disabled: Boolean,
    label: {
      default: "",
      type: String,
    },
    modelValue: Boolean,
    value: Boolean,
  },
  emits: ["update:checked", "update:modelValue", "update:value"],
  setup(props, { emit }) {
    const getValue = () => props.value || props.modelValue || props.checked;

    const updateValue = (value: boolean) => {
      emit("update:value", value);
      emit("update:modelValue", value);
      emit("update:checked", value);
    };

    return () =>
      h("div", { class: "inline-switch" }, [
        h("span", { class: "inline-switch__label" }, props.label),
        h(NSwitch, {
          disabled: props.disabled,
          value: getValue(),
          "onUpdate:value": updateValue,
        }),
      ]);
  },
});

function normalizeWorkShiftOptions(response: WorkShiftApi.WorkShiftListResult) {
  const items = response?.data ?? response?.items ?? [];

  return items
    .map((item) => {
      if (item.id === null || item.id === undefined || item.id === "") {
        return null;
      }

      const fromTime = item.fromTime || "";
      const toTime = item.toTime || "";
      const timeLabel = fromTime && toTime ? ` (${fromTime} - ${toTime})` : "";

      return {
        label: `${item.name || item.code || item.id}${timeLabel}`,
        value: item.id,
      };
    })
    .filter(Boolean) as WorkScheduleSelectOption[];
}

async function loadWorkShifts() {
  try {
    const response = await getWorkShiftListApi({ page: 1, pageSize: 100 });
    workshiftOptions.splice(0, workshiftOptions.length, ...normalizeWorkShiftOptions(response));
  } catch {
    workshiftOptions.splice(0);
  }
}

function getDateTime(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value as number | string);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isBeforeDate(value: unknown, target: unknown) {
  const valueTime = getDateTime(value);
  const targetTime = getDateTime(target);

  if (valueTime === null || targetTime === null) {
    return false;
  }

  return valueTime < targetTime;
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: "w-full",
    },
  },
  layout: "vertical",
  schema: [
    {
      component: "DatePicker",
      componentProps: {
        clearable: true,
        format: "dd-MM-yyyy",
        placeholder: "Từ ngày",
        style: { width: "100%" },
        type: "date",
        valueFormat: "yyyy-MM-dd",
      },
      fieldName: "fromDate",
      label: "Từ ngày",
      rules: "required",
    },
    {
      component: "DatePicker",
      componentProps: {
        clearable: true,
        format: "dd-MM-yyyy",
        placeholder: "Đến ngày",
        style: { width: "100%" },
        type: "date",
        valueFormat: "yyyy-MM-dd",
      },
      dependencies: {
        trigger(values: Record<string, any>) {
          if (!values.fromDate) {
            return;
          }

          if (!values.toDate) {
            formApi.setValues({ toDate: values.fromDate });
            return;
          }

          if (isBeforeDate(values.toDate, values.fromDate)) {
            message.warning(DATE_RANGE_WARNING);
            formApi.setValues({ toDate: values.fromDate });
          }
        },
        triggerFields: ["fromDate", "toDate"],
      },
      fieldName: "toDate",
      label: "Đến ngày",
      rules: "required",
    },
    {
      component: markRaw(EmployeeSearchSelect),
      componentProps: {
        mode: "multiple",
        placeholder: "Chọn nhân viên",
        style: { width: "100%" },
      },
      dependencies: {
        disabled: (values: Record<string, any>) => !!values.isApplyAll,
        triggerFields: ["isApplyAll"],
      },
      defaultValue: [],
      fieldName: "employeeIds",
      formItemClass: "md:col-span-2",
      label: "Nhân viên",
      modelPropName: "modelValue",
    },
    {
      component: "Select",
      componentProps: {
        clearable: true,
        options: workshiftOptions,
        placeholder: "Chọn ca làm việc",
        style: { width: "100%" },
      },
      fieldName: "workshiftId",
      formItemClass: "md:col-span-2",
      label: "Ca làm việc",
      rules: "selectRequired",
    },
    {
      component: markRaw(InlineSwitch),
      componentProps: {
        label: "Áp dụng tất cả",
      },
      fieldName: "isApplyAll",
      formItemClass: "md:col-span-2",
      label: "",
    },
    {
      component: "Input",
      fieldName: "source",
      formItemClass: "md:col-span-2",
      label: "Nguồn",
    },
    {
      component: "Input",
      fieldName: "description",
      formItemClass: "md:col-span-2",
      label: "Mô tả",
    },
  ],
  showDefaultActions: false,
  wrapperClass: "grid-cols-1 md:grid-cols-2 gap-4",
});

function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return formatDateToYmd(value);
  }

  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return formatDateToYmd(date);
    }
  }

  if (typeof value === "string") {
    const ymdMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (ymdMatch) {
      return ymdMatch[0];
    }

    const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return formatDateToYmd(date);
    }
  }

  return null;
}

function normalizeEmployeeIds(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const data = drawerApi.getData<{
      record: null | WorkScheduleApi.WorkScheduleItem;
    }>();
    const values = await formApi.getValues();
    const payloadValues = { ...values };
    delete payloadValues.date;

    const fromDate = normalizeDate(values.fromDate);
    const toDate = normalizeDate(values.toDate);

    if (isBeforeDate(toDate, fromDate)) {
      message.warning(DATE_RANGE_WARNING);
      formApi.setValues({ toDate: fromDate });
      return;
    }

    emit(
      "submit",
      {
        ...payloadValues,
        employeeIds: values.isApplyAll ? [] : normalizeEmployeeIds(values.employeeIds),
        fromDate,
        toDate,
      },
      data.record ?? null,
    );
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = drawerApi.getData<{
      record: null | WorkScheduleApi.WorkScheduleItem;
    }>();
    const record = data.record;

    const recordValue = record as WorkScheduleFormRecord;

    const formValues: Record<string, unknown> = {};

    if (record) {
      Object.assign(formValues, record);
    }

    formApi.setValues({
      ...formValues,
      fromDate: recordValue?.fromDate ?? recordValue?.date ?? null,
      isApplyAll: false,
      isOverride: false,
      toDate: recordValue?.toDate ?? recordValue?.date ?? null,
      employeeIds: record?.employeeIds ?? (record?.employeeId ? [record.employeeId] : []),
    });
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{
    record: null | WorkScheduleApi.WorkScheduleItem;
  }>();

  return data.record ? "Sửa lịch làm việc" : "Thêm lịch làm việc";
});

onMounted(loadWorkShifts);
</script>

<template>
  <Drawer :title="title" class="md:w-[800px]">
    <Form />
  </Drawer>
</template>

<style scoped>
:deep(.inline-switch) {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  min-height: 34px;
}

:deep(.inline-switch__label) {
  font-weight: 500;
}
</style>
