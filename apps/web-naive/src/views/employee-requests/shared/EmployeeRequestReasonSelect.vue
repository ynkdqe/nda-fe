<script lang="ts" setup>
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';

import { computed, watch } from 'vue';

import { NSelect } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    activeOnly?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    employeeRequestTypeId?: null | number;
    loading?: boolean;
    options: EmployeeRequestReasonApi.Item[];
    value?: null | number;
  }>(),
  {
    activeOnly: true,
    clearable: true,
    disabled: false,
    employeeRequestTypeId: null,
    loading: false,
    value: null,
  },
);

const emit = defineEmits<{ 'update:value': [null | number] }>();

const filteredItems = computed(() =>
  props.options.filter(
    (item) =>
      !item.isDeleted &&
      item.employeeRequestTypeId === props.employeeRequestTypeId &&
      (!props.activeOnly || item.isActive),
  ),
);
const selectOptions = computed(() =>
  [...filteredItems.value]
    .sort((a, b) => a.display - b.display || a.id - b.id)
    .map((item) => ({ label: item.name, value: item.id })),
);

watch(
  () => props.employeeRequestTypeId,
  () => {
    if (
      props.value !== null &&
      !filteredItems.value.some((item) => item.id === props.value)
    ) {
      emit('update:value', null);
    }
  },
);
</script>

<template>
  <NSelect
    :clearable="clearable"
    :disabled="disabled || !employeeRequestTypeId"
    filterable
    :loading="loading"
    :options="selectOptions"
    :placeholder="employeeRequestTypeId ? 'Chọn lý do' : 'Chọn loại đơn trước'"
    :value="value"
    @update:value="emit('update:value', $event ?? null)"
  />
</template>
