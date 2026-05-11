<script setup lang="ts">
import type { BasicOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, nextTick, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from '#/adapter/naive';
import { updateUserInfoApi } from '#/api';
import { $t } from '#/locales';

import AvatarUpload from './avatar-upload.vue';

import { useAuthStore } from '#/store';

const userStore = useUserStore();
const authStore = useAuthStore();
const profileBaseSettingRef = ref();
const avatarUrl = ref<string>('');

const MOCK_ROLES_OPTIONS: BasicOption[] = [
  {
    label: $t('page.profile.admin'),
    value: 'super',
  },
  {
    label: $t('page.profile.user'),
    value: 'user',
  },
  {
    label: $t('page.profile.test'),
    value: 'test',
  },
];

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
      fieldName: 'address',
      component: 'Input',
      label: $t('page.profile.address'),
    },
    {
      fieldName: 'roles',
      component: 'Select',
      componentProps: {
        mode: 'tags',
        options: MOCK_ROLES_OPTIONS,
      },
      label: $t('page.profile.role'),
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
    await updateUserInfoApi({ ...values, avatar: avatarUrl.value });
    message.success($t('page.profile.updateSuccess'));
    // Refresh store after update
    await authStore.fetchUserInfo();
  } catch {
    // handled by request interceptor
  }
}

function fillForm(data: any) {
  if (!data) return;

  // Set avatar
  const avatarSrc = data.avatar || data.extraProperties?.Avatar || '';
  if (avatarSrc) {
    avatarUrl.value = avatarSrc;
  }

  const values = {
    ...data,
    email: data.email || '',
    realName: data.realName || data.name || '',
    username: data.username || data.userName || '',
    phoneNumber: data.phoneNumber || '',
    birthday: data.birthDate || null,
    address: data.address || '',
  };
  profileBaseSettingRef.value?.getFormApi()?.setValues(values);
}

onMounted(async () => {
  await nextTick();
  // Fill from store
  if (userStore.userInfo) {
    fillForm(userStore.userInfo);
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Avatar upload section -->
    <div class="flex flex-col items-center gap-3 py-4">
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ $t('page.profile.avatar') }}
      </p>
      <AvatarUpload v-model="avatarUrl" />
    </div>

    <!-- Form -->
    <ProfileBaseSetting
      ref="profileBaseSettingRef"
      :form-schema="formSchema"
      @submit="handleSubmit"
    />
  </div>
</template>
