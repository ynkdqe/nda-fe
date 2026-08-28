<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestTypeApi } from '#/models/hr/employee-request-type';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
} from 'naive-ui';

const emit = defineEmits<{
  submit: [
    EmployeeRequestTypeApi.CreateInput | EmployeeRequestTypeApi.UpdateInput,
  ];
}>();

interface FormModel {
  description: string;
  displayOrder: null | number;
  icon: string;
  id?: number;
  name: string;
}

const formRef = ref<FormInst | null>(null);
const model = reactive<FormModel>({
  description: '',
  displayOrder: 0,
  icon: '',
  name: '',
});

const rules: FormRules = {
  description: {
    max: 500,
    message: 'Mô tả tối đa 500 ký tự',
    trigger: ['blur', 'input'],
  },
  displayOrder: [
    {
      required: true,
      type: 'number',
      message: 'Vui lòng nhập thứ tự hiển thị',
      trigger: ['blur', 'change'],
    },
    {
      validator: (_rule, value) => Number.isInteger(value) && value >= 0,
      message: 'Thứ tự hiển thị phải là số nguyên không âm',
      trigger: ['blur', 'change'],
    },
  ],
  icon: {
    max: 50,
    message: 'Icon tối đa 50 ký tự',
    trigger: ['blur', 'input'],
  },
  name: [
    {
      required: true,
      message: 'Vui lòng nhập tên loại đơn',
      trigger: ['blur', 'input'],
    },
    {
      max: 100,
      message: 'Tên loại đơn tối đa 100 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
};

function reset(
  record?: EmployeeRequestTypeApi.Item | null,
  defaultDisplayOrder = 0,
) {
  Object.assign(model, {
    description: record?.description ?? '',
    displayOrder: record?.displayOrder ?? defaultDisplayOrder,
    icon: record?.icon ?? '',
    id: record?.id,
    name: record?.name ?? '',
  });
  void nextTick(() => formRef.value?.restoreValidation());
}

async function submit() {
  await formRef.value?.validate();
  const base = {
    description: model.description.trim() || null,
    displayOrder: model.displayOrder ?? 0,
    icon: model.icon.trim() || null,
    name: model.name.trim(),
  };
  emit('submit', model.id ? { ...base, id: model.id } : base);
}

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) return;
    const data = drawerApi.getData<{
      defaultDisplayOrder?: number;
      record?: EmployeeRequestTypeApi.Item | null;
    }>();
    reset(data.record, data.defaultDisplayOrder);
  },
});

const title = computed(() => (model.id ? 'Sửa loại đơn' : 'Thêm loại đơn'));
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
      <NFormItem label="Tên loại đơn" path="name" required>
        <NInput
          v-model:value="model.name"
          :maxlength="100"
          show-count
          placeholder="Nhập tên loại đơn"
        />
      </NFormItem>
      <NFormItem label="Mô tả" path="description">
        <NInput
          v-model:value="model.description"
          type="textarea"
          :maxlength="500"
          show-count
          placeholder="Nhập mô tả"
        />
      </NFormItem>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Icon" path="icon">
          <NInput
            v-model:value="model.icon"
            :maxlength="50"
            placeholder="Ví dụ: lucide:calendar-off"
          >
            <template v-if="model.icon" #prefix>
              <IconifyIcon :icon="model.icon" />
            </template>
          </NInput>
        </NFormItem>
        <NFormItem label="Thứ tự hiển thị" path="displayOrder" required>
          <NInputNumber
            v-model:value="model.displayOrder"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </NFormItem>
      </div>
      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton>
        <NButton type="primary" @click="submit">Lưu</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
