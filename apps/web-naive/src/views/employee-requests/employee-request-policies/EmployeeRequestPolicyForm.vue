<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';
import type { WorkShiftApi } from '#/models/hr/workshift';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NDatePicker,
  NDivider,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';

import { getWorkShiftListApi } from '#/api';
import {
  EmployeeRequestDuration,
  EmployeeRequestEffect,
  employeeRequestDurationLabels,
  employeeRequestEffectLabels,
} from '#/models/employee-requests/employee-request';
import { toDateOnlyString, toTimestamp } from '#/utils/date';

import EmployeeRequestPolicyUnitSelect from '../shared/EmployeeRequestPolicyUnitSelect.vue';
import EmployeeRequestReasonSelect from '../shared/EmployeeRequestReasonSelect.vue';
import EmployeeRequestTypeSelect from '../shared/EmployeeRequestTypeSelect.vue';

const emit = defineEmits<{
  submit: [
    EmployeeRequestPolicyApi.CreateInput | EmployeeRequestPolicyApi.UpdateInput,
  ];
}>();
const formRef = ref<FormInst | null>(null);
const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const reasons = ref<EmployeeRequestReasonApi.Item[]>([]);
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
const workshifts = ref<WorkShiftApi.WorkShiftItem[]>([]);

const model = reactive({
  durationInput: EmployeeRequestDuration.DateRangeWithPart,
  durationMonths: null as null | number,
  effectKind: EmployeeRequestEffect.LeaveWithQuota,
  employeeRequestReasonId: null as null | number,
  employeeRequestTypeId: null as null | number,
  // Date picker giữ timestamp, chỉ đổi sang chuỗi yyyy-MM-dd khi gửi lên backend.
  fromDate: null as null | number,
  id: undefined as number | undefined,
  maxBackdateDays: 0,
  maxCarryOverDays: 0,
  maxDaysPerRequest: null as null | number,
  maxOvertimeHoursPerMonth: null as null | number,
  maxOvertimeHoursPerYear: null as null | number,
  maxTime: null as null | number,
  minNoticeDays: 0,
  minSeniorityMonths: null as null | number,
  overrideWorkshiftId: null as null | number,
  overtimeRate: null as null | number,
  paid: false,
  prorateOnJoin: false,
  requireDocument: false,
  requiredGender: null as null | number,
  seniorityBonusEnabled: false,
  toDate: null as null | number,
  unit: null as null | string,
});

const effectOptions = Object.entries(employeeRequestEffectLabels).map(
  ([value, label]) => ({ label, value: Number(value) }),
);
const durationOptions = Object.entries(employeeRequestDurationLabels).map(
  ([value, label]) => ({ label, value: Number(value) }),
);
const genderOptions = [
  { label: 'Nam', value: 0 },
  { label: 'Nữ', value: 1 },
];

/**
 * Mỗi kiểu tác động chỉ dùng một nhóm cấu hình. Ẩn hẳn nhóm không liên quan thay vì
 * hiện rồi để trống — người cấu hình không phải đoán field nào có tác dụng với loại đơn nào.
 */
const showQuota = computed(
  () => model.effectKind === EmployeeRequestEffect.LeaveWithQuota,
);
const showArrangement = computed(
  () => model.effectKind === EmployeeRequestEffect.WorkArrangement,
);
const showOvertime = computed(
  () => model.effectKind === EmployeeRequestEffect.Overtime,
);
const needsDuration = computed(
  () => model.durationInput !== EmployeeRequestDuration.None,
);

/** Gợi ý dạng thời gian phù hợp nhất với kiểu tác động vừa chọn. */
function onEffectChange(value: number) {
  model.effectKind = value;
  switch (value) {
    case EmployeeRequestEffect.Administrative: {
      model.durationInput = EmployeeRequestDuration.None;
      break;
    }
    case EmployeeRequestEffect.Overtime: {
      model.durationInput = EmployeeRequestDuration.DateTimeRange;
      break;
    }
    case EmployeeRequestEffect.TimesheetAdjustment: {
      model.durationInput = EmployeeRequestDuration.SingleDate;
      break;
    }
    case EmployeeRequestEffect.WorkArrangement: {
      model.durationInput = EmployeeRequestDuration.DateRange;
      break;
    }
    default: {
      model.durationInput = EmployeeRequestDuration.DateRangeWithPart;
    }
  }
}

const duplicate = computed(
  () =>
    model.employeeRequestTypeId !== null &&
    model.employeeRequestReasonId !== null &&
    policies.value.some(
      (x) =>
        x.id !== model.id &&
        x.employeeRequestTypeId === model.employeeRequestTypeId &&
        x.employeeRequestReasonId === model.employeeRequestReasonId,
    ),
);

const rules: FormRules = {
  employeeRequestTypeId: {
    required: true,
    type: 'number',
    message: 'Vui lòng chọn loại đơn',
    trigger: 'change',
  },
  employeeRequestReasonId: [
    {
      required: true,
      type: 'number',
      message: 'Vui lòng chọn lý do',
      trigger: 'change',
    },
    {
      validator: () =>
        reasons.value.some(
          (x) =>
            x.id === model.employeeRequestReasonId &&
            x.employeeRequestTypeId === model.employeeRequestTypeId,
        ),
      message: 'Lý do không thuộc loại đơn đã chọn',
      trigger: 'change',
    },
  ],
  overrideWorkshiftId: {
    validator: () =>
      !showArrangement.value || typeof model.overrideWorkshiftId === 'number',
    message: 'Chế độ làm việc bắt buộc chọn ca áp dụng',
    trigger: ['blur', 'change'],
  },
};

/** Cả hai mốc đều không bắt buộc, nhưng khi nhập đủ thì ngày kết thúc phải sau ngày bắt đầu. */
const dateRangeError = computed(() =>
  model.fromDate !== null &&
  model.toDate !== null &&
  model.toDate < model.fromDate
    ? 'Ngày hết hiệu lực phải sau ngày bắt đầu hiệu lực'
    : '',
);

async function submit() {
  await formRef.value?.validate();
  if (
    model.employeeRequestReasonId === null ||
    model.employeeRequestTypeId === null ||
    dateRangeError.value
  ) {
    return;
  }

  if (showArrangement.value && model.overrideWorkshiftId === null) {
    return;
  }

  // Chỉ gửi lên nhóm field thuộc về kiểu tác động đang chọn; phần còn lại gửi null
  // để dữ liệu không giữ lại giá trị thừa từ lần cấu hình trước.
  const base = {
    durationInput: model.durationInput,
    durationMonths: showArrangement.value ? model.durationMonths : null,
    effectKind: model.effectKind,
    employeeRequestReasonId: model.employeeRequestReasonId,
    employeeRequestTypeId: model.employeeRequestTypeId,
    fromDate: toDateOnlyString(model.fromDate),
    maxBackdateDays: model.maxBackdateDays,
    maxCarryOverDays: showQuota.value ? model.maxCarryOverDays : 0,
    maxDaysPerRequest: model.maxDaysPerRequest,
    maxOvertimeHoursPerMonth: showOvertime.value
      ? model.maxOvertimeHoursPerMonth
      : null,
    maxOvertimeHoursPerYear: showOvertime.value
      ? model.maxOvertimeHoursPerYear
      : null,
    maxTime: showQuota.value ? model.maxTime : null,
    minNoticeDays: model.minNoticeDays,
    minSeniorityMonths: model.minSeniorityMonths,
    overrideWorkshiftId: showArrangement.value
      ? model.overrideWorkshiftId
      : null,
    overtimeRate: showOvertime.value ? model.overtimeRate : null,
    paid: model.paid,
    prorateOnJoin: showQuota.value ? model.prorateOnJoin : false,
    requireDocument: model.requireDocument,
    requiredGender: model.requiredGender,
    seniorityBonusEnabled: showQuota.value
      ? model.seniorityBonusEnabled
      : false,
    toDate: toDateOnlyString(model.toDate),
    unit: model.unit,
  };
  emit('submit', model.id ? { ...base, id: model.id } : base);
}

const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  async onOpenChange(open) {
    if (!open) return;
    const d = drawerApi.getData<{
      policies: EmployeeRequestPolicyApi.Item[];
      reasons: EmployeeRequestReasonApi.Item[];
      record?: EmployeeRequestPolicyApi.Item | null;
      types: EmployeeRequestTypeApi.Item[];
    }>();
    types.value = d.types;
    reasons.value = d.reasons;
    policies.value = d.policies;
    Object.assign(model, {
      durationInput:
        d.record?.durationInput ?? EmployeeRequestDuration.DateRangeWithPart,
      durationMonths: d.record?.durationMonths ?? null,
      effectKind: d.record?.effectKind ?? EmployeeRequestEffect.LeaveWithQuota,
      employeeRequestReasonId: d.record?.employeeRequestReasonId ?? null,
      employeeRequestTypeId: d.record?.employeeRequestTypeId ?? null,
      fromDate: toTimestamp(d.record?.fromDate),
      id: d.record?.id,
      maxBackdateDays: d.record?.maxBackdateDays ?? 0,
      maxCarryOverDays: d.record?.maxCarryOverDays ?? 0,
      maxDaysPerRequest: d.record?.maxDaysPerRequest ?? null,
      maxOvertimeHoursPerMonth: d.record?.maxOvertimeHoursPerMonth ?? null,
      maxOvertimeHoursPerYear: d.record?.maxOvertimeHoursPerYear ?? null,
      maxTime: d.record?.maxTime ?? null,
      minNoticeDays: d.record?.minNoticeDays ?? 0,
      minSeniorityMonths: d.record?.minSeniorityMonths ?? null,
      overrideWorkshiftId: d.record?.overrideWorkshiftId ?? null,
      overtimeRate: d.record?.overtimeRate ?? null,
      paid: d.record?.paid ?? false,
      prorateOnJoin: d.record?.prorateOnJoin ?? false,
      requireDocument: d.record?.requireDocument ?? false,
      requiredGender: d.record?.requiredGender ?? null,
      seniorityBonusEnabled: d.record?.seniorityBonusEnabled ?? false,
      toDate: toTimestamp(d.record?.toDate),
      unit: d.record?.unit ?? null,
    });

    if (workshifts.value.length === 0) {
      const r = await getWorkShiftListApi({ page: 1, pageSize: 100 });
      workshifts.value = r.data ?? [];
    }

    void nextTick(() => formRef.value?.restoreValidation());
  },
});
const title = computed(() => (model.id ? 'Sửa chính sách' : 'Thêm chính sách'));
</script>
<template>
  <Drawer :title="title" class="md:w-[720px]">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      class="p-4 pb-20"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Loại đơn" path="employeeRequestTypeId" required>
          <EmployeeRequestTypeSelect
            v-model:value="model.employeeRequestTypeId"
            :options="types"
          /> </NFormItem
        ><NFormItem label="Lý do" path="employeeRequestReasonId" required>
          <EmployeeRequestReasonSelect
            v-model:value="model.employeeRequestReasonId"
            :employee-request-type-id="model.employeeRequestTypeId"
            :options="reasons"
          />
        </NFormItem>
      </div>
      <NAlert v-if="duplicate" type="warning" class="mb-4">
        Đã tồn tại chính sách cho cặp loại đơn và lý do này. Backend sẽ quyết
        định có cho phép lưu hay không.
      </NAlert>

      <NDivider title-placement="left">Hành vi của đơn</NDivider>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Khi được duyệt thì làm gì" path="effectKind">
          <NSelect
            :options="effectOptions"
            :value="model.effectKind"
            @update:value="onEffectChange"
          /> </NFormItem
        ><NFormItem label="Form hỏi thời gian dạng nào" path="durationInput">
          <NSelect
            v-model:value="model.durationInput"
            :options="durationOptions"
          />
        </NFormItem>
      </div>
      <NFormItem label="Tính lương" path="paid">
        <NSwitch v-model:value="model.paid" />
        <span class="text-muted-foreground ml-3 text-xs"
          >Thời gian này vẫn được tính công và trả lương</span
        >
      </NFormItem>

      <template v-if="showQuota">
        <NDivider title-placement="left">Hạn mức phép</NDivider>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem label="Hạn mức mỗi năm" path="maxTime">
            <NInputNumber
              v-model:value="model.maxTime"
              :min="0"
              :precision="2"
              :show-button="false"
              placeholder="Để trống = không giới hạn"
              style="width: 100%"
            /> </NFormItem
          ><NFormItem label="Đơn vị" path="unit">
            <EmployeeRequestPolicyUnitSelect v-model:value="model.unit" />
          </NFormItem>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem
            label="Chuyển tồn tối đa sang năm sau"
            path="maxCarryOverDays"
          >
            <NInputNumber
              v-model:value="model.maxCarryOverDays"
              :min="0"
              :precision="1"
              :show-button="false"
              placeholder="0 = không cho chuyển"
              style="width: 100%"
            /> </NFormItem
          ><NFormItem label="Cộng phép thâm niên" path="seniorityBonusEnabled">
            <NSwitch v-model:value="model.seniorityBonusEnabled" />
            <span class="text-muted-foreground ml-3 text-xs"
              >+1 ngày mỗi 5 năm</span
            >
          </NFormItem>
        </div>
        <NFormItem
          label="Chia theo tháng khi vào làm giữa năm"
          path="prorateOnJoin"
        >
          <NSwitch v-model:value="model.prorateOnJoin" />
          <span class="text-muted-foreground ml-3 text-xs"
            >Vào làm tháng 7 chỉ được 6/12 hạn mức</span
          >
        </NFormItem>
      </template>

      <template v-if="showArrangement">
        <NDivider title-placement="left">Chế độ làm việc</NDivider>
        <NAlert class="mb-4" type="info">
          Khi đơn được duyệt, nhân viên sẽ được gán ca làm việc bên dưới trong
          suốt thời gian hưởng chế độ, rồi tự động quay lại ca cũ khi hết hạn.
        </NAlert>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NFormItem
            label="Ca làm việc áp dụng"
            path="overrideWorkshiftId"
            required
          >
            <NSelect
              v-model:value="model.overrideWorkshiftId"
              :options="
                workshifts.map((x) => ({
                  label: `${x.name} (${x.workHours}h, ${x.workPoint} công)`,
                  value: Number(x.id),
                }))
              "
              clearable
              filterable
              placeholder="Ví dụ: HCSTS - hành chính sau thai sản"
            /> </NFormItem
          ><NFormItem label="Thời hạn (tháng)" path="durationMonths">
            <NInputNumber
              v-model:value="model.durationMonths"
              :min="1"
              :show-button="false"
              placeholder="Để trống = theo ngày trên đơn"
              style="width: 100%"
            />
          </NFormItem>
        </div>
      </template>

      <template v-if="showOvertime">
        <NDivider title-placement="left">Làm thêm giờ</NDivider>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NFormItem label="Hệ số lương" path="overtimeRate">
            <NInputNumber
              v-model:value="model.overtimeRate"
              :min="1"
              :precision="2"
              :show-button="false"
              placeholder="1.5 / 2 / 3"
              style="width: 100%"
            /> </NFormItem
          ><NFormItem label="Trần giờ/tháng" path="maxOvertimeHoursPerMonth">
            <NInputNumber
              v-model:value="model.maxOvertimeHoursPerMonth"
              :min="0"
              :show-button="false"
              placeholder="40"
              style="width: 100%"
            /> </NFormItem
          ><NFormItem label="Trần giờ/năm" path="maxOvertimeHoursPerYear">
            <NInputNumber
              v-model:value="model.maxOvertimeHoursPerYear"
              :min="0"
              :show-button="false"
              placeholder="200"
              style="width: 100%"
            />
          </NFormItem>
        </div>
      </template>

      <NDivider title-placement="left">Quy tắc nộp đơn</NDivider>
      <div v-if="needsDuration" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NFormItem label="Phải báo trước (ngày)" path="minNoticeDays">
          <NInputNumber
            v-model:value="model.minNoticeDays"
            :min="0"
            :show-button="false"
            style="width: 100%"
          /> </NFormItem
        ><NFormItem label="Cho nộp lùi (ngày)" path="maxBackdateDays">
          <NInputNumber
            v-model:value="model.maxBackdateDays"
            :min="0"
            :show-button="false"
            style="width: 100%"
          /> </NFormItem
        ><NFormItem label="Tối đa mỗi đơn (ngày)" path="maxDaysPerRequest">
          <NInputNumber
            v-model:value="model.maxDaysPerRequest"
            :min="0"
            :precision="1"
            :show-button="false"
            placeholder="Không giới hạn"
            style="width: 100%"
          />
        </NFormItem>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NFormItem label="Bắt buộc đính kèm" path="requireDocument">
          <NSwitch v-model:value="model.requireDocument" /> </NFormItem
        ><NFormItem
          label="Thâm niên tối thiểu (tháng)"
          path="minSeniorityMonths"
        >
          <NInputNumber
            v-model:value="model.minSeniorityMonths"
            :min="0"
            :show-button="false"
            placeholder="Không yêu cầu"
            style="width: 100%"
          /> </NFormItem
        ><NFormItem label="Chỉ áp dụng cho" path="requiredGender">
          <NSelect
            v-model:value="model.requiredGender"
            :options="genderOptions"
            clearable
            placeholder="Mọi giới tính"
          />
        </NFormItem>
      </div>

      <NDivider title-placement="left">Hiệu lực của chính sách</NDivider>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Hiệu lực từ" path="fromDate">
          <NDatePicker
            v-model:value="model.fromDate"
            class="w-full"
            clearable
            format="dd/MM/yyyy"
            placeholder="Không giới hạn"
            type="date"
          /> </NFormItem
        ><NFormItem label="Hiệu lực đến" path="toDate">
          <NDatePicker
            v-model:value="model.toDate"
            class="w-full"
            clearable
            format="dd/MM/yyyy"
            placeholder="Không giới hạn"
            type="date"
          />
        </NFormItem>
      </div>
      <NAlert v-if="dateRangeError" type="error" class="mb-4">
        {{ dateRangeError }}
      </NAlert>

      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton
        ><NButton type="primary" @click="submit">Lưu</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
