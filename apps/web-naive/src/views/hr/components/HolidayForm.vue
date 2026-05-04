<script lang="ts" setup>
import type { HolidayApi } from '#/api';

import { computed } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

type HolidayTypeOption = { label: string; value: number | string };

const emit = defineEmits<{
  submit: [Record<string, any>];
}>();

function syncHolidayTypeOptions(options: HolidayTypeOption[]) {
  const current = (formApi as any).getState?.();
  const schema = (current?.schema || []).map((item: any) => {
    if (item.fieldName === 'holidayType') {
      return {
        ...item,
        componentProps: {
          ...item.componentProps,
          options,
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
      fieldName: 'name',
      label: 'Tên ngày nghỉ',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
      },
      fieldName: 'holidayType',
      label: 'Loại ngày nghỉ',
      rules: 'selectRequired',
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        format: 'dd-MM-yyyy',
        type: 'date',
        valueFormat: 'yyyy-MM-dd',
      },
      fieldName: 'date',
      label: 'Ngày nghỉ',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: 'Mô tả',
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
      holidayTypes?: HolidayTypeOption[];
      record: HolidayApi.HolidayItem | null;
    }>();

    syncHolidayTypeOptions(data.holidayTypes ?? []);
    formApi.setValues(data.record ?? {});
  },
});

const title = computed(() => {
  const data = drawerApi.getData<{ record: HolidayApi.HolidayItem | null }>();
  return data.record ? 'Sửa ngày nghỉ' : 'Thêm ngày nghỉ';
});
</script>

<template>
  <Drawer :title="title" class="md:w-[700px]">
    <Form />
  </Drawer>
</template>
