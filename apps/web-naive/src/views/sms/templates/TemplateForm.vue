<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui';

import type { SmsMessageApi } from '#/models/sms';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { NForm, NFormItem, NInput, NSelect, NSwitch } from 'naive-ui';

import { fetchSmsProviderList } from '#/api';

const emit = defineEmits<{
  submit: [payload: SmsMessageApi.SmsTemplateFormPayload];
}>();

const { t } = useI18n();
const formRef = ref<FormInst | null>(null);
const providerOptions = ref<SelectOption[]>([]);
const providersLoading = ref(false);

const form = reactive<SmsMessageApi.SmsTemplateFormPayload>({
  code: '',
  id: undefined,
  isActive: true,
  name: '',
  smsProviderId: '',
  template: '',
});

const rules: FormRules = {
  code: [
    {
      message: t('page.sms.templatePage.form.codeRequired'),
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
  name: [
    {
      message: t('page.sms.templatePage.form.nameRequired'),
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
  smsProviderId: [
    {
      trigger: ['blur', 'change'],
      validator: (_rule, value) => {
        if (
          value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return new Error(t('page.sms.templatePage.form.providerRequired'));
        }

        return true;
      },
    },
  ],
  template: [
    {
      message: t('page.sms.templatePage.form.templateRequired'),
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
};

const title = computed(() =>
  form.id
    ? t('page.sms.templatePage.form.editTitle')
    : t('page.sms.templatePage.form.addTitle'),
);

function normalizeStatus(status?: boolean | number | string) {
  if (typeof status === 'boolean') {
    return status;
  }

  const normalized = String(status ?? '').trim().toLowerCase();
  return normalized === '1' || normalized === 'active' || normalized === 'true';
}

function resetForm(record?: null | SmsMessageApi.SmsTemplate) {
  Object.assign(form, {
    code: record?.code ?? '',
    id: record?.id,
    isActive: record ? normalizeStatus(record.isActive) : true,
    name: record?.name ?? '',
    smsProviderId: record?.smsProviderId ?? '',
    template: record?.template ?? record?.content ?? '',
  });
  void nextTick(() => formRef.value?.restoreValidation());
}

async function loadProviders() {
  providersLoading.value = true;
  try {
    const response = await fetchSmsProviderList({
      current: 1,
      pageSize: 1000,
    });
    providerOptions.value = (response.data ?? []).map((provider) => ({
      label: provider.name || String(provider.id),
      value: provider.id,
    }));
  } finally {
    providersLoading.value = false;
  }
}

async function handleSubmit() {
  await formRef.value?.validate();

  emit('submit', {
    code: form.code.trim(),
    id: form.id,
    isActive: form.isActive,
    name: form.name.trim(),
    smsProviderId: form.smsProviderId,
    template: form.template.trim(),
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
      record?: null | SmsMessageApi.SmsTemplate;
    }>();
    resetForm(data.record);
    if (providerOptions.value.length === 0) {
      void loadProviders();
    }
  },
});
</script>

<template>
  <Drawer :title="title" class="md:w-[760px]">
    <NForm
      ref="formRef"
      class="p-4 pb-20"
      label-placement="top"
      :model="form"
      :rules="rules"
    >
      <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <NFormItem :label="t('page.sms.templatePage.form.code')" path="code">
          <NInput
            v-model:value="form.code"
            :placeholder="t('page.sms.templatePage.form.codePlaceholder')"
          />
        </NFormItem>

        <NFormItem :label="t('page.sms.templatePage.form.name')" path="name">
          <NInput
            v-model:value="form.name"
            :placeholder="t('page.sms.templatePage.form.namePlaceholder')"
          />
        </NFormItem>
      </div>

      <NFormItem
        :label="t('page.sms.templatePage.form.provider')"
        path="smsProviderId"
      >
        <NSelect
          v-model:value="form.smsProviderId"
          filterable
          :loading="providersLoading"
          :options="providerOptions"
          :placeholder="t('page.sms.templatePage.form.providerPlaceholder')"
        />
      </NFormItem>

      <NFormItem
        :label="t('page.sms.templatePage.form.template')"
        path="template"
      >
        <NInput
          v-model:value="form.template"
          :autosize="{ minRows: 6, maxRows: 14 }"
          :placeholder="t('page.sms.templatePage.form.templatePlaceholder')"
          type="textarea"
        />
      </NFormItem>

      <NFormItem :label="t('page.sms.templatePage.form.isActive')">
        <NSwitch v-model:value="form.isActive" />
      </NFormItem>
    </NForm>
  </Drawer>
</template>
