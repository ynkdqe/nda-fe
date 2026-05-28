<script setup lang="ts">
import { computed } from 'vue';

import { $t } from '#/locales';
import { ProfileSecuritySetting } from '@vben/common-ui';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('page.profile.accountPassword'),
      description: $t('page.profile.passwordStrengthStrong'),
    },
    {
      value: true,
      fieldName: 'securityPhone',
      label: $t('page.profile.securityPhone'),
      description: $t('page.profile.boundPhone', { phone: '138****8293' }),
    },
    {
      value: true,
      fieldName: 'securityQuestion',
      label: $t('page.profile.securityQuestion'),
      description: $t('page.profile.securityQuestionNotSet'),
    },
    {
      value: true,
      fieldName: 'securityEmail',
      label: $t('page.profile.backupEmail'),
      description: $t('page.profile.boundEmail', { email: 'ant***sign.com' }),
    },
    {
      value: false,
      fieldName: 'securityMfa',
      label: $t('page.profile.mfaDevice'),
      description: $t('page.profile.mfaNotBound'),
    },
  ];
});
</script>
<template>
  <ProfileSecuritySetting :form-schema="formSchema" />
</template>
