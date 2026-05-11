<script setup lang="ts">
import type { Props } from './types';

import { preferences } from '@vben-core/preferences';
import {
  Card,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  VbenAvatar,
} from '@vben-core/shadcn-ui';

import { Page } from '../../components';

defineOptions({
  name: 'ProfileUI',
});

withDefaults(defineProps<Props>(), {
  title: '关于项目',
  tabs: () => [],
});

const tabsValue = defineModel<string>('modelValue');
</script>
<template>
  <Page auto-content-height>
    <div class="flex flex-col md:flex-row size-full gap-4">
      <Card class="w-full md:w-1/4 lg:w-1/6 flex-none">
        <div class="pt-6 pb-1 flex-col-center gap-2">
          <slot name="avatar">
            <VbenAvatar
              :src="userInfo?.avatar ?? preferences.app.defaultAvatar"
              class="size-20"
            />
          </slot>
          <span class="text-lg font-semibold leading-none">
            {{ userInfo?.realName ?? '' }}
          </span>
          <span class="text-sm text-foreground/80 leading-none">
            {{ userInfo?.username ?? '' }}
          </span>
        </div>
        <Separator class="my-0" />
        <Tabs v-model="tabsValue" orientation="vertical" class="mx-4 mb-0 mt-0">
          <TabsList class="flex flex-row md:flex-col justify-start w-full h-auto bg-card gap-1 overflow-x-auto overflow-y-hidden p-1">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="h-12 justify-start whitespace-nowrap flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>
      <Card class="w-full md:w-3/4 lg:w-5/6 flex-auto p-4 md:p-8">
        <slot name="content"></slot>
      </Card>
    </div>
  </Page>
</template>
