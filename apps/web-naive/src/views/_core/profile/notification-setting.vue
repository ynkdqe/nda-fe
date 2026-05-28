<script setup lang="ts">
import { computed } from 'vue';

import { $t } from '#/locales';
import { ProfileNotificationSetting } from '@vben/common-ui';

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: $t('page.profile.userMessages'),
      description: $t('page.profile.internalMessageDesc'),
    },
    {
      value: true,
      fieldName: 'systemMessage',
      label: $t('page.profile.systemMessages'),
      description: $t('page.profile.internalMessageDesc'),
    },
    {
      value: true,
      fieldName: 'todoTask',
      label: $t('page.profile.todoTasks'),
      description: $t('page.profile.internalMessageDesc'),
    },
  ];
});
</script>
<template>
  <ProfileNotificationSetting :form-schema="formSchema" />
</template>
