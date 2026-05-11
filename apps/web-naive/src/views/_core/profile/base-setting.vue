<script setup lang="ts">
import type { BasicOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, nextTick, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from '#/adapter/naive';
import { updateUserInfoApi } from '#/api';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

const userStore = useUserStore();
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
    {
      fieldName: 'introduction',
      component: 'Textarea',
      label: $t('page.profile.bio'),
    },
  ];
});

async function handleSubmit(values: any) {
  try {
    await updateUserInfoApi({ ...values });
    message.success($t('page.profile.updateSuccess'));
    await authStore.fetchUserInfo();
  } catch {
    // handled by request interceptor
  }
}

function fillForm(data: any) {
  if (!data) return;

  const values = {
    ...data,
    email: data.email || '',
    realName: data.realName || data.name || '',
    username: data.username || data.userName || '',
    phoneNumber: data.phoneNumber || '',
    birthday: data.birthDate || null,
  };
  profileBaseSettingRef.value?.getFormApi()?.setValues(values);
}

onMounted(async () => {
  await nextTick();
  if (userStore.userInfo) {
    fillForm(userStore.userInfo);
  }
});
</script>

<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
