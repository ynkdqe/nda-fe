<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, nextTick, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';

import { message } from '#/adapter/naive';
import { getUserInfoApi, updateUserInfoApi } from '#/api';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

const props = defineProps<{ pendingAvatar?: string }>();
const emit = defineEmits<{ saved: [] }>();

const saving = ref(false);
const profileReady = ref(false);
let profileSnapshot: Record<string, unknown> = {};
const authStore = useAuthStore();
const profileBaseSettingRef = ref();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'realName',
      component: 'Input',
      label: $t('page.profile.realName'),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: $t('page.profile.username'),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'email',
      component: 'Input',
      label: $t('page.profile.email'),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'phoneNumber',
      component: 'Input',
      label: $t('page.profile.phoneNumber'),
    },
    {
      fieldName: 'birthday',
      component: 'DatePicker',
      label: $t('page.profile.birthday'),
    },
  ];
});

async function handleSubmit(values: any) {
  if (saving.value || !profileReady.value) return;
  saving.value = true;
  try {
    const data = { ...profileSnapshot, ...values };
    if (props.pendingAvatar !== undefined) data.avatar = props.pendingAvatar;
    await updateUserInfoApi(data);
    emit('saved');
    message.success($t('page.profile.updateSuccess'));
    profileReady.value = false;
    const profile = await authStore.fetchUserInfo();
    fillForm(profile);
  } catch {
    // handled by request interceptor
  } finally {
    saving.value = false;
  }
}

function fillForm(data: any) {
  if (!data) return;
  profileSnapshot = { ...data };

  const values = {
    ...data,
    email: data.email || '',
    realName: data.realName || data.name || '',
    username: data.username || data.userName || '',
    phoneNumber: data.phoneNumber || '',
    birthday: data.birthDate || null,
  };
  profileBaseSettingRef.value?.getFormApi()?.setValues(values);
  profileReady.value = true;
}

onMounted(async () => {
  await nextTick();
  try {
    fillForm(await getUserInfoApi());
  } catch {
    // Do not submit a profile without its original concurrency stamp.
  }
});
</script>

<template>
  <p v-if="pendingAvatar" class="mb-4 text-sm text-primary">
    {{ $t('page.profile.avatarUpload.pendingSave') }}
  </p>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
