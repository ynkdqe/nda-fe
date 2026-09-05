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
  NSelect,
  NSpace,
  NTag,
  NTimePicker,
} from 'naive-ui';

import { getEmployeeRequestQuotaApi } from '#/api';
import {
  DayPart,
  dayPartLabels,
  EmployeeRequestDuration,
  EmployeeRequestEffect,
} from '#/models/employee-requests/employee-request';
import { toDateOnlyString, toTimeOnlyString } from '#/utils/date';

import PaidStatusBadge from '../shared/PaidStatusBadge.vue';

interface PeriodFormItem {
  dayPart: DayPart;
  fromDate: null | number;
  fromTime: null | number;
  key: number;
  toDate: null | number;
  toTime: null | number;
}

/** Số giờ một ngày công chuẩn, khớp LeaveDurationHelper.StandardWorkHoursPerDay ở backend. */
const STANDARD_WORK_HOURS = 8;

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
    dayPart: DayPart.FullDay,
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
      label:
        policy.employeeRequestTypeName ?? `#${policy.employeeRequestTypeId}`,
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
        policy.employeeRequestReasonName ??
        `#${policy.employeeRequestReasonId}`,
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

/**
 * Chính sách áp cho lý do đang chọn. Đây là nguồn quyết định form hỏi gì và
 * hiển thị gì — không có nó thì chỉ hiện dạng mặc định.
 */
const selectedPolicy = computed(() =>
  model.employeeRequestReasonId === null
    ? null
    : (policies.value.find(
        (policy) =>
          policy.employeeRequestReasonId === model.employeeRequestReasonId,
      ) ?? null),
);

const durationInput = computed(
  () =>
    selectedPolicy.value?.durationInput ??
    EmployeeRequestDuration.DateRangeWithPart,
);
const effectKind = computed(
  () =>
    selectedPolicy.value?.effectKind ?? EmployeeRequestEffect.LeaveWithQuota,
);

const needsPeriods = computed(
  () => durationInput.value !== EmployeeRequestDuration.None,
);
const isSingleDate = computed(
  () => durationInput.value === EmployeeRequestDuration.SingleDate,
);
const showDayPart = computed(
  () => durationInput.value === EmployeeRequestDuration.DateRangeWithPart,
);
const showTime = computed(
  () => durationInput.value === EmployeeRequestDuration.DateTimeRange,
);
/** Đơn một ngày chỉ có đúng một khoảng, không cho thêm bớt. */
const allowMultiplePeriods = computed(
  () => needsPeriods.value && !isSingleDate.value,
);
/** Chỉ đơn trừ phép mới có hạn mức để hiển thị. */
const showQuotaBox = computed(
  () => effectKind.value === EmployeeRequestEffect.LeaveWithQuota,
);

const dayPartOptions = [
  { label: dayPartLabels[DayPart.FullDay], value: DayPart.FullDay },
  { label: dayPartLabels[DayPart.Morning], value: DayPart.Morning },
  { label: dayPartLabels[DayPart.Afternoon], value: DayPart.Afternoon },
];

/**
 * Tổng số ngày yêu cầu, tính xấp xỉ giống backend nhưng chưa trừ ngày lễ
 * (frontend không có lịch nghỉ). Con số cuối cùng vẫn do backend chốt.
 */
const requestedDays = computed(() => {
  let total = 0;

  for (const period of model.periods) {
    if (period.fromDate === null || period.toDate === null) {
      continue;
    }

    if (period.dayPart === DayPart.Custom) {
      if (period.fromTime === null || period.toTime === null) {
        continue;
      }
      const hours = (period.toTime - period.fromTime) / 3_600_000;
      total += Math.max(hours, 0) / STANDARD_WORK_HOURS;
      continue;
    }

    const from = new Date(period.fromDate).setHours(0, 0, 0, 0);
    const to = new Date(period.toDate).setHours(0, 0, 0, 0);
    const days = Math.max(Math.round((to - from) / 86_400_000) + 1, 0);

    total +=
      period.dayPart === DayPart.FullDay || days === 0
        ? days
        : Math.max(days - 0.5, 0.5);
  }

  return Math.round(total * 100) / 100;
});

const quotaExceeded = computed(
  () =>
    quota.value !== null &&
    requestedDays.value > 0 &&
    requestedDays.value > quota.value.remaining,
);

/**
 * Tách tổng hạn mức thành từng nguồn để người xin nghỉ hiểu vì sao con số của mình
 * khác mức chuẩn của chính sách. Bỏ qua nguồn bằng 0 cho đỡ rối.
 */
const quotaBreakdown = computed(() => {
  const q = quota.value;
  if (!q) return [];
  const parts: string[] = [];
  if (q.baseDays > 0) parts.push(`${q.baseDays} ngày phép chuẩn`);
  if (q.seniorityDays > 0) parts.push(`${q.seniorityDays} ngày thâm niên`);
  if (q.carriedOverDays > 0)
    parts.push(`${q.carriedOverDays} ngày tồn năm trước`);
  if (q.adjustmentDays !== 0)
    parts.push(
      `${q.adjustmentDays > 0 ? '+' : ''}${q.adjustmentDays} ngày điều chỉnh`,
    );
  // Một nguồn duy nhất thì dòng chi tiết chỉ lặp lại tổng số, không có giá trị gì thêm.
  return parts.length > 1 ? parts : [];
});

/** Mô tả bằng lời điều gì sẽ xảy ra khi đơn được duyệt, để người nộp biết trước. */
const effectHint = computed(() => {
  const policy = selectedPolicy.value;
  if (!policy) return '';

  switch (policy.effectKind) {
    case EmployeeRequestEffect.Administrative: {
      return 'Thủ tục hành chính, không ảnh hưởng tới bảng công hay ngày phép.';
    }
    case EmployeeRequestEffect.LeaveNoQuota: {
      return 'Thời gian nghỉ này không trừ vào ngày phép của bạn.';
    }
    case EmployeeRequestEffect.Overtime: {
      return policy.overtimeRate
        ? `Giờ làm thêm được tính hệ số ${policy.overtimeRate}.`
        : 'Đăng ký làm thêm giờ.';
    }
    case EmployeeRequestEffect.TimesheetAdjustment: {
      return 'Đơn này dùng để bổ sung hoặc sửa dữ liệu chấm công.';
    }
    case EmployeeRequestEffect.WorkArrangement: {
      return policy.durationMonths
        ? `Khi được duyệt, ca làm việc của bạn sẽ đổi trong ${policy.durationMonths} tháng kể từ ngày bắt đầu.`
        : 'Khi được duyệt, ca làm việc của bạn sẽ đổi trong khoảng thời gian đã chọn.';
    }
    default: {
      return '';
    }
  }
});

/** Các quy tắc nộp đơn của chính sách, hiện trước để người nộp không bị backend từ chối. */
const submissionHints = computed(() => {
  const policy = selectedPolicy.value;
  if (!policy) return [];

  const hints: string[] = [];
  if (policy.minNoticeDays > 0) {
    hints.push(`phải báo trước ${policy.minNoticeDays} ngày`);
  }
  if (policy.maxBackdateDays > 0) {
    hints.push(`được nộp lùi tối đa ${policy.maxBackdateDays} ngày`);
  }
  if (policy.maxDaysPerRequest) {
    hints.push(`tối đa ${policy.maxDaysPerRequest} ngày mỗi đơn`);
  }
  if (policy.requireDocument) {
    hints.push('bắt buộc đính kèm tài liệu trước khi được duyệt');
  }
  return hints;
});

async function loadQuota() {
  quota.value = null;
  if (model.employeeRequestReasonId === null || !showQuotaBox.value) {
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

/**
 * Đổi lý do có thể đổi luôn dạng thời gian, nên phải chuẩn hoá lại các khoảng đang nhập
 * về đúng dạng mới — nếu không, dữ liệu thừa từ dạng cũ sẽ bị backend từ chối.
 */
watch(durationInput, (value) => {
  if (value === EmployeeRequestDuration.SingleDate) {
    model.periods = model.periods.slice(0, 1);
  }

  for (const period of model.periods) {
    switch (value) {
      case EmployeeRequestDuration.DateTimeRange: {
        period.dayPart = DayPart.Custom;
        break;
      }
      case EmployeeRequestDuration.DateRangeWithPart: {
        if (period.dayPart === DayPart.Custom) {
          period.dayPart = DayPart.FullDay;
        }
        break;
      }
      default: {
        period.dayPart = DayPart.FullDay;
        period.fromTime = null;
        period.toTime = null;
      }
    }

    if (value === EmployeeRequestDuration.SingleDate) {
      period.toDate = period.fromDate;
    }
  }
});

function addPeriod() {
  const period = createPeriod();
  if (durationInput.value === EmployeeRequestDuration.DateTimeRange) {
    period.dayPart = DayPart.Custom;
  }
  model.periods.push(period);
}

function removePeriod(index: number) {
  if (model.periods.length <= 1) {
    return;
  }
  model.periods.splice(index, 1);
}

/** Đơn một ngày: ngày kết thúc luôn bám theo ngày bắt đầu, người dùng không phải nhập hai lần. */
function onFromDateChange(period: PeriodFormItem, value: null | number) {
  period.fromDate = value;
  if (isSingleDate.value) {
    period.toDate = value;
  }
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
  if (!needsPeriods.value) {
    return '';
  }

  for (const [index, period] of model.periods.entries()) {
    const label = `Khoảng thời gian ${index + 1}`;

    if (period.fromDate === null || period.toDate === null) {
      return `${label}: vui lòng chọn đủ ngày bắt đầu và kết thúc`;
    }
    if (period.toDate < period.fromDate) {
      return `${label}: ngày kết thúc phải sau ngày bắt đầu`;
    }
    if (period.dayPart === DayPart.Custom) {
      if (period.fromTime === null || period.toTime === null) {
        return `${label}: vui lòng nhập giờ bắt đầu và giờ kết thúc`;
      }
      if (period.toTime <= period.fromTime) {
        return `${label}: giờ kết thúc phải sau giờ bắt đầu`;
      }
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

  if (needsPeriods.value) {
    for (const period of model.periods) {
      const fromDate = toDateOnlyString(period.fromDate);
      const toDate = toDateOnlyString(period.toDate);
      if (!fromDate || !toDate) {
        return;
      }

      // Giờ chỉ gửi khi thực sự nghỉ theo giờ; các dạng khác gửi null để backend
      // không phải đoán giá trị nào là thật.
      const custom = period.dayPart === DayPart.Custom;
      periods.push({
        dayPart: period.dayPart,
        fromDate,
        fromTime: custom ? toTimeOnlyString(period.fromTime) : null,
        toDate,
        toTime: custom ? toTimeOnlyString(period.toTime) : null,
      });
    }
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
function toPickerValue(date: null | string, time: null | string) {
  if (!date) return null;
  const parsed = new Date(`${date}T${time ?? '00:00:00'}`).getTime();
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
        dayPart: period.dayPart ?? DayPart.FullDay,
        fromDate: toPickerValue(period.fromDate, '00:00:00'),
        fromTime: toPickerValue(period.fromDate, period.fromTime ?? null),
        key: periodKey,
        toDate: toPickerValue(period.toDate, '00:00:00'),
        toTime: toPickerValue(period.toDate, period.toTime ?? null),
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
        <span class="text-gray-500">Thời gian này:</span>
        <PaidStatusBadge v-if="selectedPolicy" :paid="selectedPolicy.paid" />
        <NTag v-else :bordered="false" size="small" type="warning">
          Chưa cấu hình chính sách
        </NTag>
        <span
          v-if="selectedPolicy && showQuotaBox && selectedPolicy.maxTime"
          class="text-gray-500"
        >
          hạn mức {{ selectedPolicy.maxTime }}
          {{ selectedPolicy.unit === 'Hour' ? 'giờ' : 'ngày' }}/năm
        </span>
      </div>

      <NAlert v-if="effectHint" class="mb-4" type="info">
        {{ effectHint }}
        <div v-if="submissionHints.length > 0" class="mt-1 text-xs opacity-80">
          Lưu ý: {{ submissionHints.join(', ') }}.
        </div>
      </NAlert>

      <NAlert
        v-if="quota && showQuotaBox"
        class="mb-4"
        :type="quotaExceeded ? 'error' : 'info'"
      >
        Hạn mức năm {{ quota.year }}: đã dùng {{ quota.usedTime }} / tối đa
        {{ quota.maxTime }}, còn lại {{ quota.remaining }}.
        <template v-if="requestedDays > 0">
          Đơn này yêu cầu {{ requestedDays }} ngày.
        </template>
        <div v-if="quotaBreakdown.length > 0" class="mt-1 text-xs opacity-80">
          Gồm: {{ quotaBreakdown.join(' + ') }}.
        </div>
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

      <template v-if="needsPeriods">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">
            {{ isSingleDate ? 'Ngày áp dụng' : 'Thời gian áp dụng' }}
          </span>
          <NButton v-if="allowMultiplePeriods" size="small" @click="addPeriod">
            <template #icon><IconifyIcon icon="lucide:plus" /></template>
            Thêm khoảng
          </NButton>
        </div>

        <div
          v-for="(period, index) in model.periods"
          :key="period.key"
          class="mb-3 rounded border border-gray-200 p-3 dark:border-gray-700"
        >
          <div
            v-if="allowMultiplePeriods"
            class="mb-2 flex items-center justify-between"
          >
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
            <NFormItem
              :label="isSingleDate ? 'Ngày' : 'Từ ngày'"
              :show-feedback="false"
            >
              <NDatePicker
                class="w-full"
                clearable
                format="dd/MM/yyyy"
                type="date"
                :value="period.fromDate"
                @update:value="(v) => onFromDateChange(period, v)"
              />
            </NFormItem>
            <NFormItem
              v-if="!isSingleDate"
              label="Đến ngày"
              :show-feedback="false"
            >
              <NDatePicker
                v-model:value="period.toDate"
                class="w-full"
                clearable
                format="dd/MM/yyyy"
                type="date"
              />
            </NFormItem>
            <NFormItem v-if="showDayPart" label="Buổi" :show-feedback="false">
              <NSelect
                v-model:value="period.dayPart"
                :options="dayPartOptions"
              />
            </NFormItem>
            <template v-if="showTime">
              <NFormItem label="Giờ bắt đầu" :show-feedback="false">
                <NTimePicker
                  v-model:value="period.fromTime"
                  class="w-full"
                  clearable
                  format="HH:mm"
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
            </template>
          </div>
        </div>

        <NAlert v-if="periodError" class="mb-4" type="warning">
          {{ periodError }}
        </NAlert>
      </template>

      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton>
        <NButton :loading="quotaLoading" type="primary" @click="submit">
          {{ model.id ? 'Lưu' : 'Gửi đơn' }}
        </NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
