<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import { NDataTable } from 'naive-ui';

interface OrgItem {
  code?: string;
  displayName?: string;
  id: string;
  parentId?: string;
  userCount?: number;
}

defineProps<{
  items?: OrgItem[];
}>();

const columns: DataTableColumns<OrgItem> = [
  { key: 'code', title: 'Mã' },
  { key: 'displayName', title: 'Tên' },
  { align: 'right', key: 'userCount', title: 'Số người dùng', width: 140 },
];
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="items ?? []"
    :bordered="true"
    :single-line="false"
    row-key="id"
  />
</template>
