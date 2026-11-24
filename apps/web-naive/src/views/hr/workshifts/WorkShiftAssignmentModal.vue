<script lang="ts" setup>
import type { WorkShiftApi } from '#/models/hr/workshift';

import { computed, onMounted, ref } from 'vue';

import {
  NButton,
  NCheckbox,
  NEmpty,
  NInput,
  NModal,
  NSpace,
  NSpin,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  getWorkShiftAssignmentsApi,
  updateWorkShiftAssignmentsApi,
} from '#/api';

const props = defineProps<{ shift: WorkShiftApi.WorkShiftItem }>();
const emit = defineEmits<{ close: [] }>();

const assignments = ref<null | WorkShiftApi.Assignments>(null);
const selected = ref(new Set<number>());
const keyword = ref('');
const loading = ref(false);
const saving = ref(false);

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll('đ', 'd')
    .trim();
}

const employees = computed(() => {
  const query = normalizeSearch(keyword.value);
  return (assignments.value?.employees ?? []).filter((employee) =>
    normalizeSearch(`${employee.name} ${employee.employeeCode ?? ''}`).includes(
      query,
    ),
  );
});

const changes = computed<WorkShiftApi.AssignmentUpdateInput>(() => {
  const assignEmployeeIds: number[] = [];
  const removeEmployeeIds: number[] = [];
  for (const employee of assignments.value?.employees ?? []) {
    const checked = selected.value.has(employee.id);
    if (checked && !employee.isAssigned) {
      assignEmployeeIds.push(employee.id);
    } else if (!checked && employee.isAssigned) {
      removeEmployeeIds.push(employee.id);
    }
  }
  return { assignEmployeeIds, removeEmployeeIds };
});

const hasChanges = computed(
  () =>
    changes.value.assignEmployeeIds.length > 0 ||
    changes.value.removeEmployeeIds.length > 0,
);

function setChecked(id: number, checked: boolean) {
  if (checked) {
    selected.value.add(id);
  } else {
    selected.value.delete(id);
  }
}

async function load() {
  loading.value = true;
  try {
    const response = await getWorkShiftAssignmentsApi(props.shift.id);
    assignments.value = response.data ?? null;
    selected.value = new Set(
      (assignments.value?.employees ?? [])
        .filter((employee) => employee.isAssigned)
        .map((employee) => employee.id),
    );
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (saving.value || !hasChanges.value) return;

  saving.value = true;
  try {
    await updateWorkShiftAssignmentsApi(props.shift.id, changes.value);
    message.success('Đã cập nhật ca mặc định của nhân viên');
    emit('close');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <NModal
    :show="true"
    :title="`Phân ca · ${shift.name || shift.code || shift.id}`"
    :closable="!saving"
    :close-on-esc="!saving"
    :mask-closable="false"
    preset="card"
    style="width: min(560px, calc(100vw - 32px))"
    @update:show="(show) => !show && emit('close')"
  >
    <NSpin :show="loading">
      <template v-if="assignments">
        <NInput
          v-model:value="keyword"
          clearable
          placeholder="Tìm theo tên hoặc mã nhân viên"
        />
        <p class="my-3 text-sm">
          {{
            assignments.canRemove
              ? 'Bỏ chọn để chuyển nhân viên về ca mặc định của công ty.'
              : 'Để đổi ca cho nhân viên đang được chọn, hãy phân họ từ ca đích.'
          }}
        </p>
        <div class="max-h-80 overflow-y-auto">
          <NEmpty
            v-if="employees.length === 0"
            description="Không tìm thấy nhân viên"
          />
          <NCheckbox
            v-for="employee in employees"
            :key="employee.id"
            :checked="selected.has(employee.id)"
            :disabled="
              saving || (employee.isAssigned && !assignments.canRemove)
            "
            class="flex w-full py-1"
            @update:checked="(checked) => setChecked(employee.id, checked)"
          >
            {{ employee.name
            }}{{ employee.employeeCode ? ` · ${employee.employeeCode}` : '' }}
          </NCheckbox>
        </div>
      </template>
      <NButton v-else-if="!loading" @click="load">Tải lại danh sách</NButton>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="saving" @click="emit('close')">Hủy</NButton>
        <NButton
          type="primary"
          :disabled="!hasChanges"
          :loading="saving"
          @click="save"
        >
          Lưu phân ca
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
