<script setup lang="ts">
import { computed, h } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NDataTable, NTag } from 'naive-ui';

import { $t } from '#/locales';

const props = defineProps<{
  pageKey: string;
}>();

const title = computed(() => $t(`page.hr.${props.pageKey}`));
const description = computed(() =>
  $t('page.hr.sampleDescription', [title.value]),
);

const columns = computed(() => [
  {
    key: 'code',
    title: $t('page.hr.sampleTable.code'),
    width: 120,
  },
  {
    key: 'name',
    title: $t('page.hr.sampleTable.name'),
  },
  {
    key: 'status',
    render: (row: { status: string; statusType: 'info' | 'success' }) =>
      h(NTag, { bordered: false, type: row.statusType }, () => row.status),
    title: $t('page.hr.sampleTable.status'),
    width: 140,
  },
]);

const data = computed(() => [
  {
    code: 'HR-001',
    name: `${title.value} - ${$t('page.hr.sampleTable.sampleDataOne')}`,
    status: $t('page.hr.sampleTable.active'),
    statusType: 'success' as const,
  },
  {
    code: 'HR-002',
    name: `${title.value} - ${$t('page.hr.sampleTable.sampleDataTwo')}`,
    status: $t('page.hr.sampleTable.draft'),
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
