<script lang="ts" setup>
import type { WorkShiftApi } from '#/api';

import { computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

const emit = defineEmits<{
  submit: [Record<string, any>];
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
      component: 'Input',
      fieldName: 'code',
      label: 'Mã ca',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: 'Tên ca',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'HH:mm',
      },
      fieldName: 'fromTime',
      label: 'Giờ bắt đầu',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: 'HH:mm',
      },
      fieldName: 'toTime',
      label: 'Giờ kết thúc',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'workHours',
      label: 'Số giờ làm việc',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'workPoint',
      label: 'Điểm',
    },
    {
      component: 'Switch',
      fieldName: 'isDefault',
      label: 'Ca mặc định',
    },
    {
      component: 'Switch',
      fieldName: 'overShift',
      label: 'Qua ngày',
    },
    {
      component: 'Switch',
      fieldName: 'hasBreak',
      label: 'Có nghỉ giữa ca',
    },
  ],
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    const values = await formApi.getValues();
    emit('submit', values);
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = drawerApi.getData<{
      record: WorkShiftApi.WorkShiftItem | null;
    }>();

    formApi.setValues({
      hasBreak: false,
      isDefault: false,
      overShift: false,
      ...(data.record ?? {}),
    });
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{
    record: WorkShiftApi.WorkShiftItem | null;
  }>();
  return data.record ? 'Sửa ca làm việc' : 'Thêm ca làm việc';
});
</script>

<template>
  <Drawer :title="title" class="md:w-[800px]">
    <Form />
  </Drawer>
</template>
