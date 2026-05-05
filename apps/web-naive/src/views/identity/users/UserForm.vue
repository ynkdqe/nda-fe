<script setup lang="ts">
import { computed, reactive } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NForm, NFormItem, NInput, NSwitch } from 'naive-ui';

type UserFormModel = {
  email?: null | string;
  id?: number | string;
  isActive?: boolean;
  name?: null | string;
  phoneNumber?: null | string;
  userName?: null | string;
};

const emit = defineEmits<{
  submit: [data: UserFormModel];
}>();

const form = reactive<UserFormModel>({
  email: null,
  isActive: true,
  name: null,
  phoneNumber: null,
  userName: null,
});

function resetForm() {
  Object.assign(form, {
    email: null,
    id: undefined,
    isActive: true,
    name: null,
    phoneNumber: null,
    userName: null,
  });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm() {
    emit('submit', { ...form });
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      return;
    }

    const data = drawerApi.getData<{ record?: null | UserFormModel }>();
    resetForm();
    Object.assign(form, data.record ?? {});
  },
});

const title = computed(() => (form.id ? 'Sửa người dùng' : 'Thêm người dùng'));
</script>

<template>
  <Drawer :title="title" class="md:w-[720px]">
    <NForm :model="form" label-placement="top">
      <NFormItem label="Tên đăng nhập" path="userName">
        <NInput v-model:value="form.userName" placeholder="Nhập tên đăng nhập" />
      </NFormItem>
      <NFormItem label="Họ tên" path="name">
        <NInput v-model:value="form.name" placeholder="Nhập họ tên" />
      </NFormItem>
      <NFormItem label="Email" path="email">
        <NInput v-model:value="form.email" placeholder="Nhập email" />
      </NFormItem>
      <NFormItem label="Số điện thoại" path="phoneNumber">
        <NInput v-model:value="form.phoneNumber" placeholder="Nhập số điện thoại" />
      </NFormItem>
      <NFormItem label="Hoạt động" path="isActive">
        <NSwitch v-model:value="form.isActive" />
      </NFormItem>
    </NForm>
  </Drawer>
</template>
