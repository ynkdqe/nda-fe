<script lang="ts" setup>
import { computed } from 'vue';

import { useI18n } from '@vben/locales';

import { NAvatar, NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';

const props = defineProps<{
  avatar?: string;
  date?: string;
  isRead: boolean;
  message?: string;
  senderName?: null | string;
  title: string;
}>();

const emit = defineEmits<{
  delete: [];
  toggleRead: [];
}>();

const { t } = useI18n();

const tagType = computed(() => (props.isRead ? 'default' : 'info'));
</script>

<template>
  <div class="flex w-full gap-3">
    <NAvatar :src="avatar" round>
      {{ title?.slice(0, 1) || 'N' }}
    </NAvatar>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <div class="truncate font-medium" :class="{ 'opacity-70': isRead }">
          {{ title }}
        </div>
        <NTag :bordered="false" size="small" :type="tagType">
          {{
            isRead
              ? t('page.sms.notification.personalPage.status.read')
              : t('page.sms.notification.personalPage.status.unread')
          }}
        </NTag>
      </div>

      <div v-if="senderName" class="mt-1 text-xs text-muted-foreground">
        {{ senderName }}
      </div>

      <div class="mt-1 whitespace-pre-wrap break-words text-sm">
        {{ message }}
      </div>

      <div v-if="date" class="mt-2 text-xs text-muted-foreground">
        {{ date }}
      </div>
    </div>

    <NSpace vertical size="small">
      <NButton
        quaternary
        size="small"
        type="primary"
        @click="emit('toggleRead')"
      >
        {{
          isRead
            ? t('page.sms.notification.personalPage.actions.markUnread')
            : t('page.sms.notification.personalPage.actions.markRead')
        }}
      </NButton>

      <NPopconfirm
        :negative-text="t('page.common.cancel')"
        :positive-text="t('page.sms.notification.personalPage.actions.delete')"
        @positive-click="emit('delete')"
      >
        <template #trigger>
          <NButton quaternary size="small" type="error">
            {{ t('page.sms.notification.personalPage.actions.delete') }}
          </NButton>
        </template>
        {{ t('page.sms.notification.personalPage.actions.deleteConfirm') }}
      </NPopconfirm>
    </NSpace>
  </div>
</template>
