<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';

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
  NSpace,
  NTag,
  NTimePicker,
} from 'naive-ui';

import { getEmployeeRequestQuotaApi } from '#/api';
import { toDateOnlyString, toTimeOnlyString } from '#/utils/date';

import PaidStatusBadge from '../shared/PaidStatusBadge.vue';

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
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
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
  employeeRequestReasonId: null as null | number,
  employeeRequestTypeId: null as null | number,
  id: undefined as number | undefined,
  periods: [createPeriod()] as PeriodFormItem[],
});

/**
 * Loại đơn và lý do đều lấy từ danh sách chính sách còn hiệu lực, không lấy từ bảng gốc:
 * cặp nào chưa có chính sách thì không tạo đơn được nên cũng không nên hiện ra để chọn.
 * Lọc lý do theo loại đơn thực hiện ngay tại chỗ, không gọi lại API.
 */
const typeOptions = computed(() => {
  const seen = new Map<number, { displayOrder: number; label: string }>();

  for (const policy of policies.value) {
    if (seen.has(policy.employeeRequestTypeId)) {
      continue;
    }
    seen.set(policy.employeeRequestTypeId, {
      displayOrder: policy.employeeRequestTypeDisplayOrder ?? 0,
      label: policy.employeeRequestTypeName ?? `#${policy.employeeRequestTypeId}`,
    });
  }

  return [...seen.entries()]
    .sort((a, b) => a[1].displayOrder - b[1].displayOrder || a[0] - b[0])
    .map(([value, item]) => ({ label: item.label, value }));
});

const reasonOptions = computed(() => {
  if (model.employeeRequestTypeId === null) {
    return [];
  }

  return policies.value
    .filter(
      (policy) =>
        policy.employeeRequestTypeId === model.employeeRequestTypeId &&
        policy.employeeRequestReasonIsActive !== false,
    )
    .sort(
      (a, b) =>
        (a.employeeRequestReasonDisplay ?? 0) -
          (b.employeeRequestReasonDisplay ?? 0) ||
        a.employeeRequestReasonId - b.employeeRequestReasonId,
    )
    .map((policy) => ({
      label:
        policy.employeeRequestReasonName ?? `#${policy.employeeRequestReasonId}`,
      value: policy.employeeRequestReasonId,
    }));
});

// Đổi loại đơn thì bỏ lý do cũ nếu nó không còn thuộc loại vừa chọn.
watch(
  () => model.employeeRequestTypeId,
  () => {
    if (
      model.employeeRequestReasonId !== null &&
      !reasonOptions.value.some(
        (option) => option.value === model.employeeRequestReasonId,
      )
    ) {
      model.employeeRequestReasonId = null;
    }
  },
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

/**
 * Chính sách áp cho lý do đang chọn - quyết định ngày nghỉ có được tính lương hay không.
 * Lý do chưa gắn chính sách sẽ không tra được, khi đó hiển thị là chưa cấu hình.
 */
const selectedPolicy = computed(() =>
  model.employeeRequestReasonId === null
    ? null
    : (policies.value.find(
        (policy) =>
          policy.employeeRequestReasonId === model.employeeRequestReasonId,
      ) ?? null),
);

const quotaExceeded = computed(
  () =>
    quota.value !== null &&
    requestedDays.value > 0 &&
    requestedDays.value > quota.value.remaining,
);

async function loadQuota() {
  quota.value = null;
  if (model.employeeRequestReasonId === null) {
    return;
  }

  quotaLoading.value = true;
  try {
    // Không truyền employeeId: backend lấy hạn mức của chính người đang đăng nhập.
    const response = await getEmployeeRequestQuotaApi({
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

watch(() => model.employeeRequestReasonId, loadQuota);

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

  if (model.employeeRequestReasonId === null || periodError.value) {
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
      policies: EmployeeRequestPolicyApi.Item[];
      record?: EmployeeRequestApi.Item | null;
    }>();

    policies.value = data.policies ?? [];

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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Loại đơn" path="employeeRequestTypeId" required>
          <NSelect
            v-model:value="model.employeeRequestTypeId"
            clearable
            filterable
            :options="typeOptions"
            placeholder="Chọn loại đơn"
          />
        </NFormItem>
        <NFormItem label="Lý do" path="employeeRequestReasonId" required>
          <NSelect
            v-model:value="model.employeeRequestReasonId"
            clearable
            :disabled="model.employeeRequestTypeId === null"
            filterable
            :options="reasonOptions"
            :placeholder="
              model.employeeRequestTypeId === null
                ? 'Chọn loại đơn trước'
                : 'Chọn lý do'
            "
          />
        </NFormItem>
      </div>

      <div
        v-if="model.employeeRequestReasonId !== null"
        class="mb-4 flex flex-wrap items-center gap-2 text-sm"
      >
        <span class="text-gray-500">Ngày nghỉ theo lý do này:</span>
        <PaidStatusBadge v-if="selectedPolicy" :paid="selectedPolicy.paid" />
        <NTag v-else :bordered="false" size="small" type="warning">
          Chưa cấu hình chính sách
        </NTag>
        <span v-if="selectedPolicy" class="text-gray-500">
          hạn mức {{ selectedPolicy.maxTime }}
          {{ selectedPolicy.unit === 'Hour' ? 'giờ' : 'ngày' }}/năm
        </span>
      </div>

      <NAlert
        v-if="quota"
        class="mb-4"
        :type="quotaExceeded ? 'error' : 'info'"
      >
        Hạn mức năm {{ quota.year }}: đã dùng {{ quota.usedTime }} / tối đa
        {{ quota.maxTime + quota.carriedOverDays }}, còn lại
        {{ quota.remaining }}.
        <template v-if="quota.carriedOverDays > 0">
          Đã gồm {{ quota.carriedOverDays }} ngày phép tồn năm trước.
        </template>
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
