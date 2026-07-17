<script lang="ts" setup>
import type { TagProps } from 'naive-ui';

import { computed, ref } from 'vue';

import { NEmpty, NInput, NPopover, NScrollbar, NTag } from 'naive-ui';

interface Props {
  items?: null | string[];
  maxVisible?: number;
  tagType?: TagProps['type'];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  maxVisible: 4,
  tagType: 'default',
});

const keyword = ref('');

const normalizedItems = computed(() => [
  ...new Set(
    (props.items ?? []).map((item) => item.trim()).filter(Boolean),
  ),
]);

const visibleItems = computed(() =>
  normalizedItems.value.slice(0, Math.max(0, props.maxVisible)),
);

const remainingCount = computed(
  () => normalizedItems.value.length - visibleItems.value.length,
);

const filteredItems = computed(() => {
  const searchValue = keyword.value.trim().toLocaleLowerCase();
  if (!searchValue) {
    return normalizedItems.value;
  }

  return normalizedItems.value.filter((item) =>
    item.toLocaleLowerCase().includes(searchValue),
  );
});

function handlePopoverVisibility(show: boolean) {
  if (!show) {
    keyword.value = '';
  }
}
</script>

<template>
  <div v-if="normalizedItems.length > 0" class="flex flex-wrap gap-1 py-1">
    <NTag
      v-for="item in visibleItems"
      :key="item"
      :bordered="false"
      size="small"
      :type="tagType"
    >
      {{ item }}
    </NTag>

    <NPopover
      v-if="remainingCount > 0"
      placement="bottom-start"
      trigger="click"
      @update:show="handlePopoverVisibility"
    >
      <template #trigger>
        <NTag
          :bordered="false"
          class="cursor-pointer"
          size="small"
          type="info"
        >
          +{{ remainingCount }}
        </NTag>
      </template>

      <div class="w-72 space-y-3">
        <NInput
          v-model:value="keyword"
          clearable
          placeholder="Tìm kiếm..."
          size="small"
        />

        <NScrollbar class="max-h-64">
          <div v-if="filteredItems.length > 0" class="flex flex-wrap gap-2 pr-2">
            <NTag
              v-for="item in filteredItems"
              :key="item"
              :bordered="false"
              size="small"
              :type="tagType"
            >
              {{ item }}
            </NTag>
          </div>
          <NEmpty v-else description="Không tìm thấy dữ liệu" size="small" />
        </NScrollbar>
      </div>
    </NPopover>
  </div>
  <span v-else>-</span>
</template>
