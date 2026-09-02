<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NSwitch,
} from 'naive-ui';

import EmployeeRequestTypeSelect from '../shared/EmployeeRequestTypeSelect.vue';

const emit = defineEmits<{
  submit: [
    EmployeeRequestReasonApi.CreateInput | EmployeeRequestReasonApi.UpdateInput,
  ];
}>();
const formRef = ref<FormInst | null>(null);
const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const model = reactive({
  description: '',
  display: 0,
  employeeRequestTypeId: null as null | number,
  id: undefined as number | undefined,
  isActive: true,
  name: '',
});
const rules: FormRules = {
  employeeRequestTypeId: {
    required: true,
    type: 'number',
    message: 'Vui lòng chọn loại đơn',
    trigger: 'change',
  },
  name: [
    {
      required: true,
      message: 'Vui lòng nhập tên lý do',
      trigger: ['blur', 'input'],
    },
    {
      max: 100,
      message: 'Tên lý do tối đa 100 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
  description: {
    max: 500,
    message: 'Mô tả tối đa 500 ký tự',
    trigger: ['blur', 'input'],
  },
};
async function submit() {
  await formRef.value?.validate();
  if (model.employeeRequestTypeId === null) {
    return;
  }

  const base = {
    description: model.description.trim() || null,
    display: model.display ?? 0,
    employeeRequestTypeId: model.employeeRequestTypeId,
    isActive: model.isActive,
    name: model.name.trim(),
  };
  emit('submit', model.id ? { ...base, id: model.id } : base);
}
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) return;
    const data = drawerApi.getData<{
      record?: EmployeeRequestReasonApi.Item | null;
      types: EmployeeRequestTypeApi.Item[];
    }>();
    types.value = data.types;
    Object.assign(model, {
      description: data.record?.description ?? '',
      display: data.record?.display ?? 0,
      employeeRequestTypeId: data.record?.employeeRequestTypeId ?? null,
      id: data.record?.id,
      isActive: data.record?.isActive ?? true,
      name: data.record?.name ?? '',
    });
    void nextTick(() => formRef.value?.restoreValidation());
  },
});
const title = computed(() => (model.id ? 'Sửa lý do' : 'Thêm lý do'));
</script>
<template>
  <Drawer :title="title" class="md:w-[640px]">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      class="p-4 pb-20"
    >
      <NFormItem label="Loại đơn" path="employeeRequestTypeId" required>
        <EmployeeRequestTypeSelect
          v-model:value="model.employeeRequestTypeId"
          :options="types"
        />
      </NFormItem>
      <NFormItem label="Tên lý do" path="name" required>
        <NInput v-model:value="model.name" :maxlength="100" show-count />
      </NFormItem>
      <NFormItem label="Mô tả" path="description">
        <NInput
          v-model:value="model.description"
          type="textarea"
          :maxlength="500"
          show-count
        />
      </NFormItem>
      <NFormItem label="Thứ tự hiển thị" path="display">
        <NInputNumber
          v-model:value="model.display"
          class="w-full"
          :min="0"
          :precision="0"
          :show-button="false"
        />
      </NFormItem>
      <NFormItem label="Đang hoạt động" path="isActive">
        <NSwitch v-model:value="model.isActive" />
      </NFormItem>
      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton><NButton type="primary" @click="submit">Lưu</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
