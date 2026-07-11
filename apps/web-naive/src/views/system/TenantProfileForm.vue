<script lang="ts" setup>
import type { FormInst, SelectOption } from 'naive-ui';

import type { TenantManagementApi } from '#/models/tenant-management';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
} from 'naive-ui';

const emit = defineEmits<{
  submit: [data: TenantManagementApi.UpdateTenantProfilePayload];
}>();

type TenantProfileFormModel = {
  expiresAt: null | number;
  id: string;
  lockedEnd: null | number;
  logoUrl: string;
  name: string;
  status: null | number;
  subscription: null | number;
  url: string;
};

const statusOptions: SelectOption[] = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
];

const formRef = ref<FormInst | null>(null);
const form = reactive<TenantProfileFormModel>({
  expiresAt: null,
  id: '',
  lockedEnd: null,
  logoUrl: '',
  name: '',
  status: null,
  subscription: null,
  url: '',
});

function toTimestamp(value?: null | string) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resetForm() {
  Object.assign(form, {
    expiresAt: null,
    id: '',
    lockedEnd: null,
    logoUrl: '',
    name: '',
    status: null,
    subscription: null,
    url: '',
  });
  formRef.value?.restoreValidation();
}

function fillForm(record: TenantManagementApi.TenantItem) {
  Object.assign(form, {
    expiresAt: toTimestamp(record.profile?.expiresAt),
    id: record.id,
    lockedEnd: toTimestamp(record.profile?.lockedEnd),
    logoUrl: record.profile?.logoUrl ?? '',
    name: record.name ?? '',
    status: record.profile?.status ?? null,
    subscription: record.profile?.subscription ?? null,
    url: record.profile?.url ?? '',
  });
  formRef.value?.restoreValidation();
}
function toIsoString(value: null | number) {
  return value === null ? null : new Date(value).toISOString();
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', {
    name: form.name.trim(),
    profile: {
      expiresAt: toIsoString(form.expiresAt),
      lockedEnd: toIsoString(form.lockedEnd),
      logoUrl: form.logoUrl.trim(),
      status: form.status,
      subscription: form.subscription,
      url: form.url.trim(),
    },
    tenantId: form.id,
  });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      return;
    }

    const data = drawerApi.getData<{
      record: TenantManagementApi.TenantItem;
    }>();
    resetForm();
    fillForm(data.record);
  },
});

defineExpose({ drawerApi, resetForm });
</script>

<template>
  <Drawer title="Sửa thông tin người thuê" class="md:w-[760px]">
    <div class="p-4">
      <NForm ref="formRef" :model="form" label-placement="top">
        <NFormItem label="Tenant ID">
          <NInput :value="form.id" disabled />
        </NFormItem>

        <NFormItem label="Tên người thuê" path="name">
          <NInput v-model:value="form.name" placeholder="Nhập tên người thuê" />
        </NFormItem>

        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="Logo URL" path="logoUrl">
            <NInput
              v-model:value="form.logoUrl"
              placeholder="https://example.com/logo.png"
            />
          </NFormItem>

          <NFormItem label="Địa chỉ hệ thống" path="url">
            <NInput
              v-model:value="form.url"
              placeholder="https://example.com"
            />
          </NFormItem>

          <NFormItem label="Gói đăng ký" path="subscription">
            <NInputNumber
              v-model:value="form.subscription"
              :min="0"
              placeholder="Nhập mã gói đăng ký"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Trạng thái" path="status">
            <NSelect
              v-model:value="form.status"
              clearable
              :options="statusOptions"
              placeholder="Chọn trạng thái"
            />
          </NFormItem>

          <NFormItem label="Ngày hết hạn" path="expiresAt">
            <NDatePicker
              v-model:value="form.expiresAt"
              clearable
              type="datetime"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Khóa đến" path="lockedEnd">
            <NDatePicker
              v-model:value="form.lockedEnd"
              clearable
              type="datetime"
              style="width: 100%"
            />
          </NFormItem>
        </div>
      </NForm>
    </div>
  </Drawer>
</template>
