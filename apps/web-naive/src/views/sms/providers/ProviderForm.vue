<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui';

import type { SmsMessageApi } from '#/models/sms';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { NForm, NFormItem, NInput, NSelect } from 'naive-ui';

const emit = defineEmits<{
  submit: [payload: SmsMessageApi.SmsProviderFormPayload];
}>();

const { t } = useI18n();
const formRef = ref<FormInst | null>(null);

const form = reactive<SmsMessageApi.SmsProviderFormPayload>({
  id: undefined,
  name: '',
  providerConfig: '',
  providerSchema: '',
  providerUrl: '',
  status: 1,
});

const rules: FormRules = {
  name: [
    {
      message: t('page.sms.providerPage.form.nameRequired'),
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
  providerUrl: [
    {
      message: t('page.sms.providerPage.form.providerUrlRequired'),
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
};

const statusOptions = computed<SelectOption[]>(() => [
  {
    label: t('page.sms.providerPage.statusTag.active'),
    value: 1,
  },
  {
    label: t('page.sms.providerPage.statusTag.inactive'),
    value: 0,
  },
]);

const title = computed(() =>
  form.id
    ? t('page.sms.providerPage.form.editTitle')
    : t('page.sms.providerPage.form.addTitle'),
);

function normalizeStatus(status?: boolean | number | string): 0 | 1 {
  if (typeof status === 'boolean') {
    return status ? 1 : 0;
  }

  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  return normalized === '1' || normalized === 'active' || normalized === 'true'
    ? 1
    : 0;
}

function resetForm(record?: null | SmsMessageApi.SmsProvider) {
  Object.assign(form, {
    id: record?.id,
    name: record?.name ?? '',
    providerConfig: record?.providerConfig ?? '',
    providerSchema: record?.providerSchema ?? '',
    providerUrl: record?.providerUrl ?? '',
    status: record ? normalizeStatus(record.status) : 1,
  });
  void nextTick(() => formRef.value?.restoreValidation());
}

async function handleSubmit() {
  await formRef.value?.validate();

  emit('submit', {
    id: form.id,
    name: form.name.trim(),
    providerConfig: form.providerConfig.trim(),
    providerSchema: form.providerSchema.trim(),
    providerUrl: form.providerUrl.trim(),
    status: form.status,
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
      record?: null | SmsMessageApi.SmsProvider;
    }>();
    resetForm(data.record);
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
      <NFormItem :label="t('page.sms.providerPage.form.name')" path="name">
        <NInput
          v-model:value="form.name"
          :placeholder="t('page.sms.providerPage.form.namePlaceholder')"
        />
      </NFormItem>

      <NFormItem
        :label="t('page.sms.providerPage.form.providerUrl')"
        path="providerUrl"
      >
        <NInput
          v-model:value="form.providerUrl"
          :placeholder="t('page.sms.providerPage.form.providerUrlPlaceholder')"
        />
      </NFormItem>

      <NFormItem :label="t('page.sms.providerPage.form.status')" path="status">
        <NSelect v-model:value="form.status" :options="statusOptions" />
      </NFormItem>

      <NFormItem :label="t('page.sms.providerPage.form.providerConfig')">
        <NInput
          v-model:value="form.providerConfig"
          :autosize="{ minRows: 4, maxRows: 10 }"
          :placeholder="
            t('page.sms.providerPage.form.providerConfigPlaceholder')
          "
          type="textarea"
        />
      </NFormItem>

      <NFormItem :label="t('page.sms.providerPage.form.providerSchema')">
        <NInput
          v-model:value="form.providerSchema"
          :autosize="{ minRows: 4, maxRows: 10 }"
          :placeholder="
            t('page.sms.providerPage.form.providerSchemaPlaceholder')
          "
          type="textarea"
        />
      </NFormItem>
    </NForm>
  </Drawer>
</template>
