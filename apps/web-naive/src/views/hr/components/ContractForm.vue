<script lang="ts" setup>
import type { ContractApi } from '#/api';

import { computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

type SelectOption = { label: string; value: number | string };

const emit = defineEmits<{
  submit: [Record<string, any>];
}>();

function syncSelectOptions(options: {
  contractTypes?: SelectOption[];
  statusOptions?: SelectOption[];
}) {
  const current = (formApi as any).getState?.();
  const schema = (current?.schema || []).map((item: any) => {
    if (item.fieldName === 'status') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: options.statusOptions ?? [],
        },
      };
    }

    if (item.fieldName === 'contractType') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options: options.contractTypes ?? [],
        },
      };
    }

    return item;
  });

  (formApi as any).setState?.({ schema });
}

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
      fieldName: 'contractCode',
      label: 'Mã hợp đồng',
    },
    {
      component: 'Input',
      fieldName: 'contractName',
      label: 'Tên hợp đồng',
    },
    {
      component: 'Input',
      fieldName: 'employeeId',
      label: 'Nhân viên',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
      },
      fieldName: 'contractType',
      label: 'Loại hợp đồng',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'date',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'effectiveDate',
      label: 'Ngày hiệu lực',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'date',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'expiryDate',
      label: 'Ngày hết hạn',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'salaryGross',
      label: 'Lương gross',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        showButton: false,
      },
      fieldName: 'totalCost',
      label: 'Chi phí hợp đồng',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
      },
      fieldName: 'status',
      label: 'Trạng thái',
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
      contractTypes?: SelectOption[];
      record: ContractApi.ContractItem | null;
      statusOptions?: SelectOption[];
    }>();

    syncSelectOptions({
      contractTypes: data.contractTypes,
      statusOptions: data.statusOptions,
    });

    formApi.setValues(data.record ?? {});
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{ record: ContractApi.ContractItem | null }>();
  return data.record ? 'Sửa hợp đồng' : 'Thêm hợp đồng';
});
</script>

<template>
  <Drawer :title="title" class="md:w-[1000px]">
    <Form />
  </Drawer>
</template>
