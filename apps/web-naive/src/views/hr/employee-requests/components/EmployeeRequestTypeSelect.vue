<script lang="ts" setup>
import type { EmployeeRequestTypeApi } from '#/models/hr/employee-request-type';

import { computed } from 'vue';

import { NSelect } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    loading?: boolean;
    options: EmployeeRequestTypeApi.Item[];
    value?: null | number;
  }>(),
  { clearable: true, disabled: false, loading: false, value: null },
);

const emit = defineEmits<{ 'update:value': [null | number] }>();

const selectOptions = computed(() =>
  [...props.options]
    .filter((item) => !item.isDeleted)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    .map((item) => ({ label: item.name, value: item.id })),
);
</script>

<template>
  <NSelect
    :clearable="clearable"
    :disabled="disabled"
    filterable
    :loading="loading"
    :options="selectOptions"
    placeholder="Chọn loại đơn"
    :value="value"
    @update:value="emit('update:value', $event ?? null)"
  />
</template>
