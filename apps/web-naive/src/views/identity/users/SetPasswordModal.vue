<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NForm, NFormItem, NInput } from 'naive-ui';

import { message } from '#/adapter/naive';
import { setIdentityUserPassword } from '#/api';

type UserRecord = {
  id?: number | string;
  userName?: null | string;
};

const formRef = ref<FormInst | null>(null);
const form = reactive({
  password: '',
});
const currentRecord = ref<null | UserRecord>(null);

const rules: FormRules = {
  password: [
    {
      message: 'Vui lòng nhập mật khẩu mới',
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
};

function resetForm() {
  form.password = '';
  formRef.value?.restoreValidation();
}

async function handleSubmit() {
  await formRef.value?.validate();

  const userName = currentRecord.value?.userName?.trim();
  if (!userName) {
    message.error('Không tìm thấy tên đăng nhập');
    return;
  }

  const response = await setIdentityUserPassword({
    password: form.password,
    userName,
  });

  if (!response.success) {
    message.error(response.message || 'Đặt mật khẩu thất bại');
    return;
  }

  message.success(response.message || 'Đặt mật khẩu thành công');
  resetForm();
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      currentRecord.value = null;
      return;
    }

    const data = modalApi.getData<{ record?: UserRecord }>();
    currentRecord.value = data.record ?? null;
  },
  title: 'Đặt mật khẩu',
});
</script>

<template>
  <Modal class="md:w-[520px]">
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Người dùng">
        <NInput :value="currentRecord?.userName || ''" readonly />
      </NFormItem>
      <NFormItem label="Mật khẩu mới" path="password">
        <NInput
          v-model:value="form.password"
          placeholder="Nhập mật khẩu mới"
          type="password"
          show-password-on="click"
        />
      </NFormItem>
    </NForm>
  </Modal>
</template>
