<script setup lang="ts">
import type { WorkbenchTodoItem } from '../typing';

import { IconifyIcon } from '@vben/icons';

import { Card, CardContent, CardHeader, CardTitle } from '@vben-core/shadcn-ui';

interface Props {
  items?: WorkbenchTodoItem[];
  title: string;
}

defineOptions({
  name: 'WorkbenchTodo',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});

function getPriorityIcon(priority?: string) {
  switch (priority) {
    case 'high': {
      return 'mdi:arrow-up-bold';
    }
    case 'low': {
      return 'mdi:arrow-down-bold';
    }
    case 'medium': {
      return 'mdi:equal';
    }
    default: {
      return 'mdi:minus';
    }
  }
}

function getPriorityClass(priority?: string) {
  switch (priority) {
    case 'high': {
      return 'bg-red-500/10 text-red-500';
    }
    case 'low': {
      return 'bg-blue-500/10 text-blue-500';
    }
    case 'medium': {
      return 'bg-orange-500/10 text-orange-500';
    }
    default: {
      return 'bg-muted text-muted-foreground';
    }
  }
}
</script>

<template>
  <Card>
    <CardHeader class="py-4">
      <CardTitle class="text-lg">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-wrap p-5 pt-0">
      <ul class="w-full divide-y divide-border" role="list">
        <li
          v-for="item in items"
          :key="item.id ?? item.title"
          class="flex cursor-pointer justify-between gap-x-6 py-5"
        >
          <div class="flex min-w-0 items-center gap-x-4">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-full"
              :class="getPriorityClass(item.priority)"
            >
              <IconifyIcon class="size-4" :icon="getPriorityIcon(item.priority)" />
            </div>
            <div class="min-w-0 flex-auto">
              <p class="text-sm/6 font-semibold text-foreground">
                {{ item.title }}
              </p>
              <!-- eslint-disable vue/no-v-html -->
              <p
                class="mt-1 truncate text-xs/5 text-foreground/80 *:text-primary"
                v-html="item.content"
              ></p>
              <p class="mt-1 truncate text-xs/5 text-foreground/80 *:text-primary">
                {{ item.date }}
              </p>
            </div>
          </div>
          <div class="hidden h-full shrink-0 sm:flex sm:flex-col sm:items-end">
            <span class="mt-6 text-xs/6 text-foreground/80">
              {{ item.status || '-' }}
            </span>
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
