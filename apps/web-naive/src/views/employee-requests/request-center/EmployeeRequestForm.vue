<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeApi } from '#/api/hr/employee';
import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTimePicker,
} from 'naive-ui';

import { getEmployeeRequestQuotaApi } from '#/api';
import { toDateOnlyString, toTimeOnlyString } from '#/utils/date';

import EmployeeRequestReasonSelect from '../shared/EmployeeRequestReasonSelect.vue';
import EmployeeRequestTypeSelect from '../shared/EmployeeRequestTypeSelect.vue';

interface PeriodFormItem {
  fromDate: null | number;
  fromTime: null | number;
  key: number;
  toDate: null | number;
  toTime: null | number;
}

const emit = defineEmits<{
  submit: [EmployeeRequestApi.CreateInput | EmployeeRequestApi.UpdateInput];
}>();

const formRef = ref<FormInst | null>(null);
const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const reasons = ref<EmployeeRequestReasonApi.Item[]>([]);
const employees = ref<EmployeeApi.EmployeeItem[]>([]);
const quota = ref<EmployeeRequestApi.Quota | null>(null);
const quotaLoading = ref(false);

let periodKey = 0;

function createPeriod(): PeriodFormItem {
  periodKey += 1;
  return {
    fromDate: null,
    fromTime: null,
    key: periodKey,
    toDate: null,
    toTime: null,
  };
}

const model = reactive({
  description: '',
  employeeId: null as null | number,
  employeeRequestReasonId: null as null | number,
  employeeRequestTypeId: null as null | number,
  id: undefined as number | undefined,
  periods: [createPeriod()] as PeriodFormItem[],
});

const employeeOptions = computed(() =>
  employees.value.map((item) => ({
    label: item.employeeCode
      ? `${item.name ?? ''} (${item.employeeCode})`
      : (item.name ?? String(item.id)),
    value: Number(item.id),
  })),
);

/** Tổng số ngày yêu cầu, tính giống backend: (toDate - fromDate) + 1 cho mỗi khoảng. */
const requestedDays = computed(() => {
  let total = 0;

  for (const period of model.periods) {
    if (period.fromDate === null || period.toDate === null) {
      continue;
    }

    const from = new Date(period.fromDate).setHours(0, 0, 0, 0);
    const to = new Date(period.toDate).setHours(0, 0, 0, 0);
    const days = Math.round((to - from) / 86_400_000) + 1;
    total += Math.max(days, 0);
  }

  return total;
});

const quotaExceeded = computed(
  () =>
    quota.value !== null &&
    requestedDays.value > 0 &&
    requestedDays.value > quota.value.remaining,
);

async function loadQuota() {
  quota.value = null;
  if (model.employeeId === null || model.employeeRequestReasonId === null) {
    return;
  }

  quotaLoading.value = true;
  try {
    const response = await getEmployeeRequestQuotaApi({
      employeeId: model.employeeId,
      employeeRequestReasonId: model.employeeRequestReasonId,
    });
    quota.value = response.data ?? null;
  } catch {
    // Lý do không cấu hình hạn mức sẽ trả success=false; interceptor đã hiển thị,
    // ở đây chỉ cần coi như không có hạn mức để không chặn người dùng tạo đơn.
    quota.value = null;
  } finally {
    quotaLoading.value = false;
  }
}

watch(() => [model.employeeId, model.employeeRequestReasonId], loadQuota);

function addPeriod() {
  model.periods.push(createPeriod());
}

function removePeriod(index: number) {
  if (model.periods.length <= 1) {
    return;
  }
  model.periods.splice(index, 1);
}

const rules: FormRules = {
  employeeId: {
    message: 'Vui lòng chọn nhân viên',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  employeeRequestTypeId: {
    message: 'Vui lòng chọn loại đơn',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  employeeRequestReasonId: {
    message: 'Vui lòng chọn lý do',
    required: true,
    trigger: 'change',
    type: 'number',
  },
  description: {
    max: 500,
    message: 'Mô tả tối đa 500 ký tự',
    trigger: ['blur', 'input'],
  },
};

const periodError = computed(() => {
  for (const [index, period] of model.periods.entries()) {
    if (period.fromDate === null || period.toDate === null) {
      return `Khoảng thời gian ${index + 1}: vui lòng chọn đủ ngày bắt đầu và kết thúc`;
    }
    if (period.toDate < period.fromDate) {
      return `Khoảng thời gian ${index + 1}: ngày kết thúc phải sau ngày bắt đầu`;
    }
  }
  return '';
});

async function submit() {
  await formRef.value?.validate();

  if (
    model.employeeId === null ||
    model.employeeRequestReasonId === null ||
    periodError.value
  ) {
    return;
  }

  const periods: EmployeeRequestApi.PeriodInput[] = [];
  for (const period of model.periods) {
    const fromDate = toDateOnlyString(period.fromDate);
    const toDate = toDateOnlyString(period.toDate);
    if (!fromDate || !toDate) {
      return;
    }

    periods.push({
      fromDate,
      fromTime: toTimeOnlyString(period.fromTime) ?? '00:00:00',
      toDate,
      toTime: toTimeOnlyString(period.toTime) ?? '23:59:00',
    });
  }

  emit(
    'submit',
    model.id === undefined
      ? {
          description: model.description.trim(),
          employeeId: model.employeeId,
          employeeRequestReasonId: model.employeeRequestReasonId,
          periods,
        }
      : {
          description: model.description.trim(),
          employeeRequestReasonId: model.employeeRequestReasonId,
          id: model.id,
          periods,
        },
  );
}

/** Chuyển `yyyy-MM-dd` / `HH:mm:ss` từ backend về timestamp cho date/time picker. */
function toPickerValue(date: string, time: string) {
  const parsed = new Date(`${date}T${time}`).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) {
      return;
    }

    const data = drawerApi.getData<{
      employees: EmployeeApi.EmployeeItem[];
      reasons: EmployeeRequestReasonApi.Item[];
      record?: EmployeeRequestApi.Item | null;
      types: EmployeeRequestTypeApi.Item[];
    }>();

    types.value = data.types;
    reasons.value = data.reasons;
    employees.value = data.employees;

    periodKey = 0;
    quota.value = null;

    const record = data.record ?? null;
    const recordPeriods = (record?.periods ?? []).map((period) => {
      periodKey += 1;
      return {
        fromDate: toPickerValue(period.fromDate, '00:00:00'),
        fromTime: toPickerValue(period.fromDate, period.fromTime),
        key: periodKey,
        toDate: toPickerValue(period.toDate, '00:00:00'),
        toTime: toPickerValue(period.toDate, period.toTime),
      };
    });

    Object.assign(model, {
      description: record?.description ?? '',
      employeeId: record?.employeeId ?? null,
      employeeRequestReasonId: record?.employeeRequestReasonId ?? null,
      employeeRequestTypeId: record?.employeeRequestTypeId ?? null,
      id: record?.id,
      periods: recordPeriods.length > 0 ? recordPeriods : [createPeriod()],
    });

    void nextTick(() => formRef.value?.restoreValidation());
  },
});

const title = computed(() => (model.id ? 'Sửa đơn' : 'Tạo đơn mới'));
</script>

<template>
  <Drawer class="md:w-[720px]" :title="title">
    <NForm
      ref="formRef"
      class="p-4 pb-20"
      label-placement="top"
      :model="model"
      :rules="rules"
    >
      <NFormItem label="Nhân viên" path="employeeId" required>
        <NSelect
          v-model:value="model.employeeId"
          clearable
          :disabled="model.id !== undefined"
          filterable
          :options="employeeOptions"
          placeholder="Chọn nhân viên"
        />
      </NFormItem>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Loại đơn" path="employeeRequestTypeId" required>
          <EmployeeRequestTypeSelect
            v-model:value="model.employeeRequestTypeId"
            :options="types"
          />
        </NFormItem>
        <NFormItem label="Lý do" path="employeeRequestReasonId" required>
          <EmployeeRequestReasonSelect
            v-model:value="model.employeeRequestReasonId"
            :employee-request-type-id="model.employeeRequestTypeId"
            :options="reasons"
          />
        </NFormItem>
      </div>

      <NAlert
        v-if="quota"
        class="mb-4"
        :type="quotaExceeded ? 'error' : 'info'"
      >
        Hạn mức năm {{ quota.year }}: đã dùng {{ quota.usedTime }} / tối đa
        {{ quota.maxTime }}, còn lại {{ quota.remaining }}.
        <template v-if="requestedDays > 0">
          Đơn này yêu cầu {{ requestedDays }} ngày.
        </template>
      </NAlert>

      <NFormItem label="Mô tả" path="description">
        <NInput
          v-model:value="model.description"
          :autosize="{ maxRows: 5, minRows: 2 }"
          maxlength="500"
          placeholder="Nhập lý do chi tiết"
          show-count
          type="textarea"
        />
      </NFormItem>

      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium">Thời gian nghỉ</span>
        <NButton size="small" @click="addPeriod">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          Thêm khoảng
        </NButton>
      </div>

      <div
        v-for="(period, index) in model.periods"
        :key="period.key"
        class="mb-3 rounded border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm text-gray-500">Khoảng {{ index + 1 }}</span>
          <NButton
            circle
            :disabled="model.periods.length <= 1"
            quaternary
            size="small"
            type="error"
            @click="removePeriod(index)"
          >
            <template #icon><IconifyIcon icon="lucide:trash-2" /></template>
          </NButton>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NFormItem label="Từ ngày" :show-feedback="false">
            <NDatePicker
              v-model:value="period.fromDate"
              class="w-full"
              clearable
              format="dd/MM/yyyy"
              type="date"
            />
          </NFormItem>
          <NFormItem label="Giờ bắt đầu" :show-feedback="false">
            <NTimePicker
              v-model:value="period.fromTime"
              class="w-full"
              clearable
              format="HH:mm"
            />
          </NFormItem>
          <NFormItem label="Đến ngày" :show-feedback="false">
            <NDatePicker
              v-model:value="period.toDate"
              class="w-full"
              clearable
              format="dd/MM/yyyy"
              type="date"
            />
          </NFormItem>
          <NFormItem label="Giờ kết thúc" :show-feedback="false">
            <NTimePicker
              v-model:value="period.toTime"
              class="w-full"
              clearable
              format="HH:mm"
            />
          </NFormItem>
        </div>
      </div>

      <NAlert v-if="periodError" class="mb-4" type="warning">
        {{ periodError }}
      </NAlert>

      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton>
        <NButton :loading="quotaLoading" type="primary" @click="submit">
          {{ model.id ? 'Lưu' : 'Gửi đơn' }}
        </NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
