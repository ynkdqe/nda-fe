<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

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
      fieldName: 'userName',
      label: 'Tài khoản',
    },
    {
      component: 'Input',
      fieldName: 'employeeCode',
      label: 'Mã nhân viên',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: 'Họ tên',
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: 'Điện thoại',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: 'Email',
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
      record: EmployeeApi.EmployeeItem | null;
    }>();
    formApi.setValues(data.record ?? {});
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{ record: EmployeeApi.EmployeeItem | null }>();
  return data.record ? 'Sửa nhân viên' : 'Thêm nhân viên';
});
</script>

<template>
  <Drawer :title="title">
    <Form />
  </Drawer>
</template>
