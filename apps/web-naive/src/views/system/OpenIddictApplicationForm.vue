<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui';

import type { OpenIddictApplicationApi } from '#/models/openiddict';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NDynamicTags, NForm, NFormItem, NInput, NSelect } from 'naive-ui';

const emit = defineEmits<{
  submit: [data: OpenIddictApplicationApi.ApplicationFormPayload];
}>();

const applicationTypeOptions: SelectOption[] = [
  { label: 'Web', value: 'web' },
  { label: 'Native', value: 'native' },
];
const clientTypeOptions: SelectOption[] = [
  { label: 'Public', value: 'public' },
  { label: 'Confidential', value: 'confidential' },
];
const consentTypeOptions: SelectOption[] = [
  { label: 'Explicit', value: 'explicit' },
  { label: 'External', value: 'external' },
  { label: 'Implicit', value: 'implicit' },
  { label: 'Systematic', value: 'systematic' },
];

const formRef = ref<FormInst | null>(null);
const editId = ref<string>();

function createInitialForm(): OpenIddictApplicationApi.CreateApplicationParams {
  return {
    applicationType: 'web',
    clientId: '',
    clientSecret: '',
    clientType: 'public',
    clientUri: '',
    consentType: 'implicit',
    displayName: '',
    grantTypes: ['authorization_code'],
    logoUri: '',
    postLogoutRedirectUris: [],
    redirectUris: [],
    scopes: ['openid', 'profile'],
  };
}

const form = reactive(createInitialForm());

const rules: FormRules = {
  applicationType: {
    message: 'Vui lòng chọn loại ứng dụng',
    required: true,
    trigger: ['blur', 'change'],
  },
  clientId: {
    message: 'Vui lòng nhập Client ID',
    required: true,
    trigger: ['blur', 'input'],
  },
  clientType: {
    message: 'Vui lòng chọn loại client',
    required: true,
    trigger: ['blur', 'change'],
  },
  consentType: {
    message: 'Vui lòng chọn loại đồng ý',
    required: true,
    trigger: ['blur', 'change'],
  },
  displayName: {
    message: 'Vui lòng nhập tên hiển thị',
    required: true,
    trigger: ['blur', 'input'],
  },
};

function normalizeList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeText(value: string) {
  return value.trim();
}

function resetForm() {
  editId.value = undefined;
  Object.assign(form, createInitialForm());
  formRef.value?.restoreValidation();
}

function fillForm(record?: null | OpenIddictApplicationApi.ApplicationItem) {
  if (!record) {
    return;
  }

  editId.value = record.id;
  Object.assign(form, {
    applicationType: record.applicationType ?? 'web',
    clientId: record.clientId,
    clientSecret: '',
    clientType: record.clientType ?? 'public',
    clientUri: record.clientUri ?? '',
    consentType: record.consentType ?? 'implicit',
    displayName: record.displayName ?? '',
    grantTypes: [...(record.grantTypes ?? [])],
    logoUri: record.logoUri ?? '',
    postLogoutRedirectUris: [...(record.postLogoutRedirectUris ?? [])],
    redirectUris: [...(record.redirectUris ?? [])],
    scopes: [...(record.scopes ?? [])],
  });
  formRef.value?.restoreValidation();
}

async function handleSubmit() {
  await formRef.value?.validate();

  emit('submit', {
    ...form,
    id: editId.value,
    clientId: normalizeText(form.clientId),
    clientSecret: normalizeText(form.clientSecret),
    clientUri: normalizeText(form.clientUri),
    displayName: normalizeText(form.displayName),
    grantTypes: normalizeList(form.grantTypes),
    logoUri: normalizeText(form.logoUri),
    postLogoutRedirectUris: normalizeList(form.postLogoutRedirectUris),
    redirectUris: normalizeList(form.redirectUris),
    scopes: normalizeList(form.scopes),
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
      record?: null | OpenIddictApplicationApi.ApplicationItem;
    }>();
    resetForm();
    fillForm(data.record);
  },
});

const title = computed(() =>
  editId.value ? 'Sửa ứng dụng xác thực' : 'Thêm ứng dụng xác thực',
);

defineExpose({ drawerApi, resetForm });
</script>

<template>
  <Drawer :title="title" class="md:w-[900px]">
    <div class="p-4">
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <NFormItem label="Client ID" path="clientId" required>
            <NInput
              v-model:value="form.clientId"
              :disabled="!!editId"
              placeholder="Ví dụ: NDA_App"
            />
          </NFormItem>

          <NFormItem label="Tên hiển thị" path="displayName" required>
            <NInput
              v-model:value="form.displayName"
              placeholder="Nhập tên ứng dụng"
            />
          </NFormItem>

          <NFormItem label="Loại ứng dụng" path="applicationType" required>
            <NSelect
              v-model:value="form.applicationType"
              :options="applicationTypeOptions"
              tag
              filterable
            />
          </NFormItem>

          <NFormItem label="Loại client" path="clientType" required>
            <NSelect
              v-model:value="form.clientType"
              :options="clientTypeOptions"
            />
          </NFormItem>

          <NFormItem label="Loại đồng ý" path="consentType" required>
            <NSelect
              v-model:value="form.consentType"
              :options="consentTypeOptions"
              tag
              filterable
            />
          </NFormItem>

          <NFormItem label="Client secret" path="clientSecret">
            <NInput
              v-model:value="form.clientSecret"
              placeholder="Nhập secret nếu client là confidential"
              show-password-on="click"
              type="password"
            />
          </NFormItem>

          <NFormItem label="Client URI" path="clientUri">
            <NInput
              v-model:value="form.clientUri"
              placeholder="https://example.com"
            />
          </NFormItem>

          <NFormItem label="Logo URI" path="logoUri">
            <NInput
              v-model:value="form.logoUri"
              placeholder="https://example.com/logo.png"
            />
          </NFormItem>
        </div>

        <NFormItem label="Redirect URI" path="redirectUris">
          <NDynamicTags
            v-model:value="form.redirectUris"
            :input-props="{ placeholder: 'Nhập URI rồi nhấn Enter' }"
          />
        </NFormItem>

        <NFormItem
          label="Post-logout redirect URI"
          path="postLogoutRedirectUris"
        >
          <NDynamicTags
            v-model:value="form.postLogoutRedirectUris"
            :input-props="{ placeholder: 'Nhập URI rồi nhấn Enter' }"
          />
        </NFormItem>

        <NFormItem label="Grant types" path="grantTypes">
          <NDynamicTags
            v-model:value="form.grantTypes"
            :input-props="{ placeholder: 'Nhập grant type rồi nhấn Enter' }"
          />
        </NFormItem>

        <NFormItem label="Scopes" path="scopes">
          <NDynamicTags
            v-model:value="form.scopes"
            :input-props="{ placeholder: 'Nhập scope rồi nhấn Enter' }"
          />
        </NFormItem>
      </NForm>
    </div>
  </Drawer>
</template>
