<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { NSelect } from 'naive-ui';

import { requestClient } from '#/api/request';

type Mode = 'multiple' | 'single';
type EmployeeSelectValue = number | string;
type EmployeeModelValue =
  | EmployeeSelectValue
  | EmployeeSelectValue[]
  | undefined;

type EmployeeRecord = Record<string, unknown>;

interface EmployeeOption extends SelectOption {
  birthDate: Date | null;
  email: string;
  identification: string;
  label: string;
  name: string;
  phone: string;
  userName: string;
  value: EmployeeSelectValue;
}

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    debounceMs?: number;
    disabled?: boolean;
    mode?: Mode;
    modelValue?: EmployeeModelValue;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    debounceMs: 300,
    disabled: false,
    mode: 'single',
    modelValue: undefined,
    placeholder: undefined,
  },
);

const emit = defineEmits<{
  change: [
    value: EmployeeModelValue,
    option?: EmployeeOption | EmployeeOption[] | null,
  ];
  'update:modelValue': [value: EmployeeModelValue];
}>();

const isMultiple = computed(() => props.mode === 'multiple');
const innerValue = ref<EmployeeModelValue>(props.modelValue);
const options = ref<EmployeeOption[]>([]);
const loading = ref(false);

let timer: null | ReturnType<typeof setTimeout> = null;
let searchSeq = 0;

watch(
  () => props.modelValue,
  (value) => {
    innerValue.value = value;
  },
);

function isRecord(value: unknown): value is EmployeeRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toRecordList(response: unknown): EmployeeRecord[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }

  if (!isRecord(response)) {
    return [];
  }

  const data = response.data;
  const items = response.items;

  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (Array.isArray(items)) {
    return items.filter(isRecord);
  }

  return [];
}

function toText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function toOptionValue(value: unknown): EmployeeSelectValue | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  }

  return undefined;
}

function normalize(response: unknown): EmployeeOption[] {
  return toRecordList(response)
    .map((employee) => {
      const value = toOptionValue(employee.id);
      const userName = toText(employee.userName);
      const email = toText(employee.email);
      const name = toText(employee.name, userName || email || 'Unknown');
      const birthDate = toText(employee.birthDate);

      if (value === undefined) {
        return null;
      }

      return {
        birthDate: birthDate ? new Date(birthDate) : null,
        email,
        identification: toText(employee.identification),
        label: `${name}${userName ? ` (${userName})` : ''}`,
        name,
        phone: toText(employee.phone),
        userName,
        value,
      } satisfies EmployeeOption;
    })
    .filter((option): option is EmployeeOption => option !== null);
}

async function fetchEmployees(keyword: string) {
  return requestClient.get<unknown>('/api/hrms/employee/_search', {
    params: { Keyword: keyword || undefined },
    responseReturn: 'body',
  });
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function onSearch(keyword: string) {
  clearTimer();

  timer = setTimeout(async () => {
    const currentSeq = ++searchSeq;
    loading.value = true;

    try {
      const response = await fetchEmployees(keyword);

      if (currentSeq === searchSeq) {
        options.value = normalize(response);
      }
    } catch {
      if (currentSeq === searchSeq) {
        options.value = [];
      }
    } finally {
      if (currentSeq === searchSeq) {
        loading.value = false;
      }
    }
  }, props.debounceMs);
}

function normalizeModelValue(
  value: EmployeeSelectValue | EmployeeSelectValue[] | null,
): EmployeeModelValue {
  return value === null ? undefined : value;
}

function onChange(
  value: EmployeeSelectValue | EmployeeSelectValue[] | null,
  option: EmployeeOption | EmployeeOption[] | null,
) {
  const nextValue = normalizeModelValue(value);

  innerValue.value = nextValue;
  emit('update:modelValue', nextValue);
  emit('change', nextValue, option);
}

function onFocus() {
  if (options.value.length === 0) {
    onSearch('');
  }
}

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<template>
  <NSelect
    :clearable="allowClear"
    :disabled="disabled"
    filterable
    :loading="loading"
    :multiple="isMultiple"
    :options="options"
    :placeholder="
      placeholder || (isMultiple ? 'Chọn nhiều nhân viên' : 'Chọn nhân viên')
    "
    remote
    :value="innerValue"
    @focus="onFocus"
    @search="onSearch"
    @update:value="onChange"
  />
</template>
