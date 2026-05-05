<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NModal } from "naive-ui";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    providerKey?: string;
    providerName?: string;
    title?: string;
  }>(),
  {
    modelValue: false,
    providerKey: "",
    providerName: "",
    title: "Quyền",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <NModal
    :show="modelValue"
    preset="card"
    :title="title"
    class="w-[720px]"
    @update:show="(value) => emit('update:modelValue', value)"
  >
    <NCard embedded :bordered="false">
      <NDescriptions :column="1" bordered>
        <NDescriptionsItem label="Provider name">
          {{ props.providerName }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Provider key">
          {{ props.providerKey }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </NModal>
</template>
