<script setup lang="ts">
import { computed, h } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NDataTable, NTag } from 'naive-ui';

import { $t } from '#/locales';

const props = defineProps<{
  pageKey: string;
}>();

const title = computed(() => $t(`page.sms.${props.pageKey}`));
const description = computed(() =>
  $t('page.sms.sampleDescription', [title.value]),
);

const columns = computed(() => [
  {
    key: 'code',
    title: $t('page.sms.sampleTable.code'),
    width: 120,
  },
  {
    key: 'name',
    title: $t('page.sms.sampleTable.name'),
  },
  {
    key: 'status',
    render: (row: { status: string; statusType: 'info' | 'success' }) =>
      h(NTag, { bordered: false, type: row.statusType }, () => row.status),
    title: $t('page.sms.sampleTable.status'),
    width: 140,
  },
]);

const data = computed(() => [
  {
    code: 'SMS-001',
    name: `${title.value} - ${$t('page.sms.sampleTable.sampleDataOne')}`,
    status: $t('page.sms.sampleTable.active'),
    statusType: 'success' as const,
  },
  {
    code: 'SMS-002',
    name: `${title.value} - ${$t('page.sms.sampleTable.sampleDataTwo')}`,
    status: $t('page.sms.sampleTable.draft'),
    statusType: 'info' as const,
  },
]);
</script>

<template>
  <Page :description="description" :title="title">
    <NCard :bordered="false" class="shadow-sm">
      <NDataTable :columns="columns" :data="data" />
    </NCard>
  </Page>
</template>
