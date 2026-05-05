<script lang="ts" setup>
import type { ContractTypeApi } from '#/api';

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
      label: 'Mã loại hợp đồng',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: 'Tên loại hợp đồng',
      rules: 'required',
    },
    {
      component: 'Switch',
      fieldName: 'hasSocialInsurance',
      label: 'Đóng BHXH',
    },
    {
      component: 'Switch',
      fieldName: 'isTaxFixed',
      label: 'Thuế cố định',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'taxPercent',
      label: 'Thuế (%)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'employeeSocialInsurancePercent',
      label: 'BHXH nhân viên (%)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'employeeHealthInsurancePercent',
      label: 'BHYT nhân viên (%)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'employeeUnemployeeInsurancePercent',
      label: 'BHTN nhân viên (%)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'minInsuranceSalary',
      label: 'Lương đóng BH tối thiểu',
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
    const data = drawerApi.getData<{
      record: ContractTypeApi.ContractTypeItem | null;
    }>();

    emit('submit', {
      ...(data.record?.id ? { id: data.record.id } : {}),
      ...values,
    });
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }

    const data = drawerApi.getData<{
      record: ContractTypeApi.ContractTypeItem | null;
    }>();

    formApi.setValues({
      hasSocialInsurance: false,
      isTaxFixed: false,
      ...(data.record ?? {}),
    });
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{
    record: ContractTypeApi.ContractTypeItem | null;
  }>();

  return data.record ? 'Sửa loại hợp đồng' : 'Thêm loại hợp đồng';
});
</script>

<template>
  <Drawer :title="title" class="md:w-[800px]">
    <Form />
  </Drawer>
</template>
