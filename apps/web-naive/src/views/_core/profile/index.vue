<script setup lang="ts">
import { ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { $t } from '#/locales';

import ProfileAvatarUpload from './avatar-upload.vue';
import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const userStore = useUserStore();

const tabsValue = ref<string>('basic');
const pendingAvatar = ref<string>();

function onAvatarUploaded(url: string) {
  pendingAvatar.value = url;
  tabsValue.value = 'basic';
}

const tabs = ref([
  {
    label: $t('page.profile.basicSettings'),
    value: 'basic',
  },
  {
    label: $t('page.profile.securitySettings'),
    value: 'security',
  },
  {
    label: $t('page.profile.changePassword'),
    value: 'password',
  },
  {
    label: $t('page.profile.notificationSettings'),
    value: 'notice',
  },
]);
</script>
<template>
  <Profile
    v-model:model-value="tabsValue"
    :title="$t('page.profile.title')"
    :user-info="userStore.userInfo"
    :tabs="tabs"
  >
    <template #avatar>
      <ProfileAvatarUpload
        :avatar="pendingAvatar"
        @uploaded="onAvatarUploaded"
      />
    </template>
    <template #content>
      <div v-show="tabsValue === 'basic'">
        <ProfileBase
          :pending-avatar="pendingAvatar"
          @saved="pendingAvatar = undefined"
        />
      </div>
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </Profile>
</template>
