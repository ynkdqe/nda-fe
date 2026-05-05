<script setup lang="ts">
import { reactive, ref } from "vue";

import { useVbenModal } from "@vben/common-ui";

import { NForm, NFormItem, NInput } from "naive-ui";

type UserRecord = {
  id?: number | string;
  userName?: null | string;
};

const form = reactive({
  password: "",
});
const currentRecord = ref<null | UserRecord>(null);

function resetForm() {
  form.password = "";
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm() {
    resetForm();
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      return;
    }

    const data = modalApi.getData<{ record?: UserRecord }>();
    currentRecord.value = data.record ?? null;
  },
  title: "Đặt mật khẩu",
});
</script>

<template>
  <Modal class="md:w-[520px]">
    <NForm :model="form" label-placement="top">
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
