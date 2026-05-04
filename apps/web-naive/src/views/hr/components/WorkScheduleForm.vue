<script lang="ts" setup>
import type { WorkScheduleApi } from '#/api';

import { computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

const emit = defineEmits<{
  submit: [Record<string, any>, WorkScheduleApi.WorkScheduleItem | null];
}>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'date',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'date',
      label: 'Ngày làm việc',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập ID nhân viên, nhiều ID cách nhau bằng dấu phẩy',
      },
      fieldName: 'employeeIds',
      label: 'Nhân viên',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'Nhập ID ca làm việc',
      },
      fieldName: 'workshiftId',
      label: 'Ca làm việc',
    },
    {
      component: 'Switch',
      fieldName: 'isApplyAll',
      label: 'Áp dụng tất cả',
    },
    {
      component: 'Input',
      fieldName: 'source',
      label: 'Nguồn',
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: 'Mô tả',
    },
  ],
  showDefaultActions: false,
});

function normalizeEmployeeIds(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value
    .split(',')
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
      record: WorkScheduleApi.WorkScheduleItem | null;
    }>();
    const values = await formApi.getValues();

    emit(
      'submit',
      {
        ...values,
        employeeIds: normalizeEmployeeIds(values.employeeIds),
      },
      data.record ?? null,
    );
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = drawerApi.getData<{
      record: WorkScheduleApi.WorkScheduleItem | null;
    }>();
    const record = data.record;

    formApi.setValues({
      isApplyAll: false,
      ...(record ?? {}),
      employeeIds: Array.isArray(record?.employeeIds)
        ? record.employeeIds.join(',')
        : record?.employeeId
          ? String(record.employeeId)
          : undefined,
    });
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{
    record: WorkScheduleApi.WorkScheduleItem | null;
  }>();

  return data.record ? 'Sửa lịch làm việc' : 'Thêm lịch làm việc';
});
</script>

<template>
  <Drawer :title="title" class="md:w-[800px]">
    <Form />
  </Drawer>
</template>
