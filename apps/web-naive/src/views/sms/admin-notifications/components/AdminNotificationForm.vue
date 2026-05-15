<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";

import { computed, reactive, ref, watch } from "vue";

import { useI18n } from "@vben/locales";

import { NForm, NFormItem, NGrid, NGridItem, NInput, NSelect, NSwitch } from "naive-ui";

import UserSearchSelect from "#/components/UserSearchSelect.vue";

type NotificationType = 0 | 1;

type FormModel = {
  icon?: string;
  isSystem: boolean;
  message: string;
  recipientIds: string[];
  senderId?: string;
  title: string;
  type: NotificationType;
  url?: string;
};

const props = defineProps<{
  modelValue: FormModel;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: FormModel];
}>();

const { t } = useI18n();
const formRef = ref<FormInst | null>(null);
const inner = reactive<FormModel>({ ...props.modelValue });

const rules: FormRules = {
  message: [
    {
      required: true,
      trigger: ["blur", "input"],
      message: t("page.sms.notification.administrationPage.form.messageRequired"),
    },
  ],
  title: [
    {
      required: true,
      trigger: ["blur", "input"],
      message: t("page.sms.notification.administrationPage.form.titleRequired"),
    },
  ],
};

const typeOptions = computed(() => [
  {
    label: t("page.sms.notification.administrationPage.form.private"),
    value: 0,
  },
  {
    label: t("page.sms.notification.administrationPage.form.public"),
    value: 1,
  },
]);

const disableSender = computed(() => inner.isSystem === true);
const disableRecipients = computed(() => inner.type === 1);

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(inner, value || {});
  },
  { deep: true },
);

watch(
  inner,
  (value) => {
    emit("update:modelValue", { ...value });
  },
  { deep: true },
);

watch(
  () => inner.isSystem,
  (value) => {
    if (value) {
      inner.senderId = undefined;
    }
  },
);

watch(
  () => inner.type,
  (value) => {
    if (value === 1) {
      inner.recipientIds = [];
    }
  },
);

async function validate() {
  await formRef.value?.validate();
}

defineExpose({ validate });
</script>

<template>
  <NForm ref="formRef" :model="inner" :rules="rules" label-placement="top">
    <NGrid :cols="24" :x-gap="16">
      <NGridItem :span="12">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.system')">
          <NSwitch v-model:value="inner.isSystem" />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="12">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.type')">
          <NSelect v-model:value="inner.type" :options="typeOptions" />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="24">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.sender')">
          <UserSearchSelect
            v-model="inner.senderId"
            :disabled="disableSender"
            :placeholder="t('page.sms.notification.administrationPage.form.senderPlaceholder')"
          />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="24">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.recipient')">
          <UserSearchSelect
            v-model="inner.recipientIds"
            :disabled="disableRecipients"
            mode="multiple"
            :placeholder="t('page.sms.notification.administrationPage.form.recipientPlaceholder')"
          />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="24">
        <NFormItem path="title" :label="t('page.sms.notification.administrationPage.form.title')">
          <NInput
            v-model:value="inner.title"
            :placeholder="t('page.sms.notification.administrationPage.form.titlePlaceholder')"
          />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="24">
        <NFormItem
          path="message"
          :label="t('page.sms.notification.administrationPage.form.message')"
        >
          <NInput
            v-model:value="inner.message"
            :autosize="{ minRows: 4, maxRows: 8 }"
            :placeholder="t('page.sms.notification.administrationPage.form.messagePlaceholder')"
            type="textarea"
          />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="12">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.icon')">
          <NInput
            v-model:value="inner.icon"
            :placeholder="t('page.sms.notification.administrationPage.form.iconPlaceholder')"
          />
        </NFormItem>
      </NGridItem>

      <NGridItem :span="12">
        <NFormItem :label="t('page.sms.notification.administrationPage.form.url')">
          <NInput
            v-model:value="inner.url"
            :placeholder="t('page.sms.notification.administrationPage.form.urlPlaceholder')"
          />
        </NFormItem>
      </NGridItem>
    </NGrid>
  </NForm>
</template>
