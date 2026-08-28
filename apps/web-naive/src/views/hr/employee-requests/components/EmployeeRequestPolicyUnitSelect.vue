<script lang="ts" setup>
import { computed } from 'vue';

import { NSelect } from 'naive-ui';

import { employeeRequestPolicyUnits } from '#/models/hr/employee-request-policy';

const props = defineProps<{ value?: null | string }>();
const emit = defineEmits<{ 'update:value': [null | string] }>();

const options = computed(() => {
  const values = employeeRequestPolicyUnits.map((item) => item.value as string);
  const legacy = props.value?.trim();
  return legacy && !values.includes(legacy)
    ? [...employeeRequestPolicyUnits, { label: legacy, value: legacy }]
    : [...employeeRequestPolicyUnits];
});
</script>

<template>
  <NSelect
    clearable
    :options="options"
    placeholder="Chọn đơn vị"
    :value="value"
    @update:value="emit('update:value', $event ?? null)"
  />
</template>
