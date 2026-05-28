<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { NSelect } from 'naive-ui';

import { requestClient } from '#/api/request';

type Mode = 'multiple' | 'single';
type UserSelectValue = string;
type UserModelValue = null | string | string[] | undefined;
type UserRecord = Record<string, unknown>;

interface UserOption extends SelectOption {
  label: string;
  rawData: UserRecord;
  value: UserSelectValue;
}

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    debounceMs?: number;
    disabled?: boolean;
    mode?: Mode;
    modelValue?: UserModelValue;
    placeholder?: string;
    user?: null | UserRecord;
  }>(),
  {
    allowClear: true,
    debounceMs: 300,
    disabled: false,
    mode: 'single',
    modelValue: undefined,
    placeholder: undefined,
    user: null,
  },
);

const emit = defineEmits<{
  change: [value: UserModelValue];
  'update:modelValue': [value: UserModelValue];
  userSelected: [user: UserRecord];
}>();

const isMultiple = computed(() => props.mode === 'multiple');
const innerValue = ref<UserModelValue>(props.modelValue);
const options = ref<UserOption[]>([]);
const loading = ref(false);
const userDataMap = ref<Record<string, UserRecord>>({});

let timer: null | ReturnType<typeof setTimeout> = null;
let searchSeq = 0;

watch(
  () => [props.modelValue, props.user] as const,
  ([value]) => {
    innerValue.value = value;
    upsertUserOption(getInjectedUserOption());
  },
  {
    immediate: true,
  },
);

function isRecord(value: unknown): value is UserRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toRecordList(response: unknown): UserRecord[] {
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

function toUserId(user: UserRecord) {
  const id = user.Id ?? user.id ?? user.UserId ?? user.userId;

  if (typeof id === 'string') {
    return id.trim();
  }

  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }

  return '';
}

function toUserOption(user?: null | UserRecord): null | UserOption {
  if (!user) {
    return null;
  }

  const userId = toUserId(user);

  if (!userId) {
    return null;
  }

  const explicitLabel = toText(user.Label ?? user.label);
  const userName = toText(user.userName ?? user.UserName);
  const email = toText(user.email ?? user.Email);
  const name = toText(user.name ?? user.Name, userName || email || 'Unknown');

  return {
    label: explicitLabel || `${name}${userName ? ` (${userName})` : ''}`,
    rawData: user,
    value: userId,
  };
}

function getInjectedUserOption() {
  return toUserOption(isRecord(props.user) ? props.user : null);
}

function mergeInjectedUserOption(nextOptions: UserOption[]) {
  const injectedOption = getInjectedUserOption();

  if (!injectedOption) {
    return nextOptions;
  }

  return [
    injectedOption,
    ...nextOptions.filter((option) => option.value !== injectedOption.value),
  ];
}

function syncUserDataMap(nextOptions: UserOption[]) {
  userDataMap.value = Object.fromEntries(
    nextOptions.map((option) => [option.value, option.rawData]),
  );
}

function upsertUserOption(option?: null | UserOption) {
  if (!option) {
    return;
  }

  options.value = mergeInjectedUserOption(options.value);
  userDataMap.value = {
    ...userDataMap.value,
    [option.value]: option.rawData,
  };
}

function normalize(response: unknown): UserOption[] {
  const nextOptions: UserOption[] = [];

  for (const user of toRecordList(response)) {
    const option = toUserOption(user);

    if (option) {
      nextOptions.push(option);
    }
  }

  const mergedOptions = mergeInjectedUserOption(nextOptions);
  syncUserDataMap(mergedOptions);
  return mergedOptions;
}

async function fetchUsers(keyword: string) {
  return requestClient.get<unknown>('/api/identity/users/_search', {
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
      const response = await fetchUsers(keyword);

      if (currentSeq === searchSeq) {
        options.value = normalize(response);
      }
    } catch {
      if (currentSeq === searchSeq) {
        options.value = mergeInjectedUserOption([]);
        syncUserDataMap(options.value);
      }
    } finally {
      if (currentSeq === searchSeq) {
        loading.value = false;
      }
    }
  }, props.debounceMs);
}

function normalizeModelValue(value: null | string | string[]): UserModelValue {
  return value;
}

function onChange(value: null | string | string[]) {
  const nextValue = normalizeModelValue(value);

  innerValue.value = nextValue;
  emit('update:modelValue', nextValue);
  emit('change', nextValue);

  if (!isMultiple.value && typeof nextValue === 'string') {
    const selectedUser = userDataMap.value[nextValue];

    if (selectedUser) {
      emit('userSelected', selectedUser);
    }
  }
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
      placeholder || (isMultiple ? 'Chọn nhiều người dùng' : 'Chọn người dùng')
    "
    remote
    :value="innerValue"
    @focus="onFocus"
    @search="onSearch"
    @update:value="onChange"
  />
</template>
