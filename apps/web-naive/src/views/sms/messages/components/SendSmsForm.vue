<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { SmsMessageApi } from '#/models/sms';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { NForm, NFormItem, NInput, NModal, NSelect, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  fetchSmsProviderList,
  fetchSmsTemplateList,
  sendSmsMessage,
} from '#/api';

const props = defineProps({
  visible: { type: Boolean, required: true },
});

const emit = defineEmits<{
  sent: [];
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();

const formRef = ref<FormInst | null>(null);
const modalVisible = ref(false);
const loading = ref(false);
const optionsLoading = ref(false);

const templates = ref<SmsMessageApi.SmsTemplate[]>([]);
const providers = ref<SmsMessageApi.SmsProvider[]>([]);
const selectedTemplateId = ref<number | string>();
const selectedProviderId = ref<number | string>();

const form = reactive({
  clientId: 'nda',
  data: {} as Record<string, string>,
  phoneNumber: '',
  smsProviderId: undefined as number | string | undefined,
  smsTemplateId: undefined as number | string | undefined,
});

const rules: FormRules = {
  phoneNumber: [
    {
      required: true,
      trigger: ['blur', 'input'],
      validator: (_rule, value) => {
        if (!String(value ?? '').trim()) {
          return new Error(t('page.sms.messagePage.form.phonePlaceholder'));
        }
        return true;
      },
    },
  ],
  smsTemplateId: [
    {
      required: true,
      trigger: ['blur', 'change'],
      validator: (_rule, value) => {
        if (value === undefined || value === null || value === '') {
          return new Error(t('page.sms.messagePage.form.templatePlaceholder'));
        }
        return true;
      },
    },
  ],
};

const templateOptions = computed(() =>
  templates.value.map((item) => ({
    label:
      [item.name, item.code].filter(Boolean).join(' - ') || String(item.id),
    value: item.id,
  })),
);

const providerOptions = computed(() =>
  providers.value.map((item) => ({
    label: item.name || String(item.id),
    value: item.id,
  })),
);

const parameterKeys = computed(() => Object.keys(form.data));

const templatePreview = computed(() => {
  const currentTemplate = templates.value.find(
    (item) => String(item.id) === String(selectedTemplateId.value),
  );
  const templateContent = currentTemplate?.template ?? currentTemplate?.content;

  if (!templateContent) {
    return '';
  }

  let content = templateContent;
  for (const [key, value] of Object.entries(form.data)) {
    content = content.replaceAll(
      new RegExp(`#${key}#`, 'g'),
      String(value ?? ''),
    );
  }

  return content;
});

watch(
  () => props.visible,
  (value) => {
    modalVisible.value = value;
  },
  { immediate: true },
);

watch(modalVisible, (value) => {
  emit('update:visible', value);

  if (value) {
    resetForm();
  }
});

watch(selectedTemplateId, (id) => {
  form.smsTemplateId = id;
  form.data = {};

  const currentTemplate = templates.value.find(
    (item) => String(item.id) === String(id),
  );
  const templateContent = currentTemplate?.template ?? currentTemplate?.content;

  if (templateContent) {
    const parameterKeys = [...templateContent.matchAll(/#(\d+)#/g)].map(
      (match) => match[1],
    );

    for (const key of parameterKeys) {
      form.data[String(key)] = '';
    }
  }

  if (currentTemplate?.smsProviderId) {
    selectedProviderId.value = currentTemplate.smsProviderId;
    form.smsProviderId = currentTemplate.smsProviderId;
  } else {
    selectedProviderId.value = undefined;
    form.smsProviderId = undefined;
  }
});

watch(selectedProviderId, (value) => {
  form.smsProviderId = value;
});

async function loadTemplates() {
  const response = await fetchSmsTemplateList({ page: 1, pageSize: 1000 });
  templates.value = response.data ?? [];
}

async function loadProviders() {
  const response = await fetchSmsProviderList({ page: 1, pageSize: 1000 });
  providers.value = response.data ?? [];
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    await Promise.all([loadTemplates(), loadProviders()]);
  } finally {
    optionsLoading.value = false;
  }
}

onMounted(() => {
  loadOptions();
});

function resetForm() {
  form.phoneNumber = '';
  form.smsTemplateId = undefined;
  form.smsProviderId = undefined;
  form.data = {};
  selectedTemplateId.value = undefined;
  selectedProviderId.value = undefined;
  formRef.value?.restoreValidation();
}

function close() {
  modalVisible.value = false;
}

async function handleSend() {
  await formRef.value?.validate();

  loading.value = true;
  try {
    await sendSmsMessage({
      clientId: form.clientId,
      data: form.data,
      phoneNumber: form.phoneNumber,
      smsProviderId: form.smsProviderId,
      smsTemplateId: form.smsTemplateId,
    });
    message.success(t('page.sms.messagePage.form.sendSuccess'));
    emit('sent');
    close();
  } catch (error: any) {
    message.error(error?.message || t('page.sms.messagePage.form.sendFail'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="dialog"
    :title="t('page.sms.messagePage.form.title')"
    :positive-text="t('common.confirm')"
    :negative-text="t('common.cancel')"
    :loading="loading"
    :mask-closable="false"
    style="width: 600px"
    @positive-click="handleSend"
    @negative-click="close"
    @close="close"
  >
    <NSpin :show="optionsLoading">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem
          :label="t('page.sms.messagePage.form.phoneLabel')"
          path="phoneNumber"
        >
          <NInput
            v-model:value="form.phoneNumber"
            :placeholder="t('page.sms.messagePage.form.phonePlaceholder')"
          />
        </NFormItem>

        <NFormItem
          :label="t('page.sms.messagePage.form.templateLabel')"
          path="smsTemplateId"
        >
          <NSelect
            v-model:value="selectedTemplateId"
            :options="templateOptions"
            :placeholder="t('page.sms.messagePage.form.templatePlaceholder')"
            filterable
          />
        </NFormItem>

        <NFormItem :label="t('page.sms.messagePage.form.providerLabel')">
          <NSelect
            v-model:value="selectedProviderId"
            :options="providerOptions"
            :placeholder="t('page.sms.messagePage.form.providerPlaceholder')"
            disabled
            filterable
          />
        </NFormItem>

        <template v-if="parameterKeys.length > 0">
          <NFormItem
            v-for="key in parameterKeys"
            :key="key"
            :label="t('page.sms.messagePage.form.parameterLabel', { key })"
          >
            <NInput
              v-model:value="form.data[key]"
              :placeholder="
                t('page.sms.messagePage.form.parameterPlaceholder', { key })
              "
            />
          </NFormItem>
        </template>

        <NFormItem
          v-if="templatePreview"
          :label="t('page.sms.messagePage.form.previewLabel')"
        >
          <NInput
            :value="templatePreview"
            :autosize="{ minRows: 4, maxRows: 8 }"
            disabled
            type="textarea"
          />
        </NFormItem>
      </NForm>
    </NSpin>
  </NModal>
</template>
