<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NForm, NFormItem, NInput, NSwitch } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

export interface RoleFormModel {
  concurrencyStamp?: string;
  id?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
  name: string;
}

const emit = defineEmits<{
  (e: 'submit', payload: RoleFormModel): void;
}>();

const formRef = ref<FormInst | null>(null);

const form = reactive<RoleFormModel>({
  concurrencyStamp: '',
  id: undefined,
  isDefault: false,
  isPublic: false,
  isStatic: false,
  name: '',
});

const rules: FormRules = {
  name: [
    { message: 'Tên vai trò là bắt buộc', required: true, trigger: 'blur' },
    { max: 64, message: 'Tên vai trò không được vượt quá 64 ký tự', trigger: 'input' },
  ],
};

function resetForm() {
  formRef.value?.restoreValidation();
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', { ...form });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: handleSubmit,
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const { record } = drawerApi.getData<{
        record: null | Partial<RoleFormModel>;
      }>();
      form.id = record?.id;
      form.name = record?.name ?? '';
      form.isDefault = !!record?.isDefault;
      form.isPublic = !!record?.isPublic;
      form.isStatic = !!record?.isStatic;
      form.concurrencyStamp = record?.concurrencyStamp ?? '';
      resetForm();
    } else {
      resetForm();
    }
  },
});
</script>

<template>
  <Drawer :title="form.id ? 'Sửa vai trò' : 'Thêm vai trò'">
    <div class="p-4">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="Tên vai trò" path="name" required>
          <NInput
            v-model:value="form.name"
            placeholder="Nhập tên vai trò..."
            @keydown.enter="handleSubmit"
          />
        </NFormItem>

        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="Mặc định">
            <NSwitch v-model:value="form.isDefault" />
          </NFormItem>
          <NFormItem label="Công khai">
            <NSwitch v-model:value="form.isPublic" />
          </NFormItem>
        </div>
      </NForm>
    </div>
  </Drawer>
</template>
