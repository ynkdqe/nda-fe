<script setup lang="ts">
import type { SelectOption } from "naive-ui";

import { computed } from "vue";

import { NSelect } from "naive-ui";

type StatusValue = number | string;
type StatusModelValue = null | StatusValue | StatusValue[] | undefined;

interface StatusItem {
  id?: null | StatusValue;
  label?: string;
  name?: string;
  value?: null | StatusValue;
}

const props = withDefaults(
  defineProps<{
    modelValue?: StatusModelValue;
    multiple?: boolean;
    placeholder?: string;
    statuses: StatusItem[];
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    placeholder: undefined,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: StatusModelValue];
}>();

const options = computed<SelectOption[]>(() => {
  const nextOptions: SelectOption[] = [];

  for (const status of props.statuses) {
    const value = status.id ?? status.value;

    if (value === null || value === undefined) {
      continue;
    }

    nextOptions.push({
      label: status.name ?? status.label ?? String(value),
      value,
    });
  }

  return nextOptions;
});

function onChange(value: StatusModelValue) {
  emit("update:modelValue", value);
}
</script>

<template>
  <NSelect
    clearable
    :multiple="multiple"
    :options="options"
    :placeholder="placeholder || (multiple ? 'Chọn nhiều' : 'Chọn')"
    style="width: 100%"
    :value="modelValue"
    @update:value="onChange"
  />
</template>
