<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { $t } from '#/locales';
import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from '#/adapter/naive';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: $t('page.profile.oldPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('page.profile.oldPasswordPlaceholder'),
      },
    },
    {
      fieldName: 'newPassword',
      label: $t('page.profile.newPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('page.profile.newPasswordPlaceholder'),
      },
    },
    {
      fieldName: 'confirmPassword',
      label: $t('page.profile.confirmPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('page.profile.confirmPasswordPlaceholder'),
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({
              required_error: $t('page.profile.confirmPasswordPlaceholder'),
            })
            .min(1, { message: $t('page.profile.confirmPasswordPlaceholder') })
            .refine((value) => value === newPassword, {
              message: $t('page.profile.passwordMismatch'),
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

function handleSubmit() {
  message.success($t('page.profile.passwordChangeSuccess'));
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-full md:w-1/2 lg:w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
