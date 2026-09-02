<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

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
  NSpace,
  NSwitch,
} from 'naive-ui';

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
const model = reactive({
  employeeRequestReasonId: null as null | number,
  employeeRequestTypeId: null as null | number,
  // Date picker giữ timestamp, chỉ đổi sang chuỗi yyyy-MM-dd khi gửi lên backend.
  fromDate: null as null | number,
  id: undefined as number | undefined,
  maxCarryOverDays: 0,
  maxTime: null as null | number,
  paid: false,
  prorateOnJoin: false,
  seniorityBonusEnabled: false,
  toDate: null as null | number,
  unit: null as null | string,
});
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
  maxTime: [
    {
      required: true,
      type: 'number',
      message: 'Vui lòng nhập hạn mức tối đa',
      trigger: ['blur', 'change'],
    },
    {
      validator: (_r, v) => typeof v === 'number' && v > 0,
      message: 'Hạn mức tối đa phải lớn hơn 0',
      trigger: ['blur', 'change'],
    },
  ],
  unit: { required: true, message: 'Vui lòng chọn đơn vị', trigger: 'change' },
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
    model.maxTime === null ||
    dateRangeError.value
  ) {
    return;
  }

  const base = {
    employeeRequestReasonId: model.employeeRequestReasonId,
    employeeRequestTypeId: model.employeeRequestTypeId,
    fromDate: toDateOnlyString(model.fromDate),
    maxCarryOverDays: model.maxCarryOverDays,
    maxTime: model.maxTime,
    paid: model.paid,
    prorateOnJoin: model.prorateOnJoin,
    seniorityBonusEnabled: model.seniorityBonusEnabled,
    toDate: toDateOnlyString(model.toDate),
    unit: model.unit,
  };
  emit('submit', model.id ? { ...base, id: model.id } : base);
}
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
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
      employeeRequestReasonId: d.record?.employeeRequestReasonId ?? null,
      employeeRequestTypeId: d.record?.employeeRequestTypeId ?? null,
      fromDate: toTimestamp(d.record?.fromDate),
      id: d.record?.id,
      maxCarryOverDays: d.record?.maxCarryOverDays ?? 0,
      maxTime: d.record?.maxTime ?? null,
      paid: d.record?.paid ?? false,
      prorateOnJoin: d.record?.prorateOnJoin ?? false,
      seniorityBonusEnabled: d.record?.seniorityBonusEnabled ?? false,
      toDate: toTimestamp(d.record?.toDate),
      unit: d.record?.unit ?? null,
    });
    void nextTick(() => formRef.value?.restoreValidation());
  },
});
const title = computed(() => (model.id ? 'Sửa chính sách' : 'Thêm chính sách'));
</script>
<template>
  <Drawer :title="title" class="md:w-[640px]">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      class="p-4 pb-20"
    >
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
        /> </NFormItem
      ><NAlert v-if="duplicate" type="warning" class="mb-4">
        Đã tồn tại chính sách cho cặp loại đơn và lý do này. Backend sẽ quyết
        định có cho phép lưu hay không.
      </NAlert>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NFormItem label="Hạn mức tối đa" path="maxTime" required>
          <NInputNumber
            v-model:value="model.maxTime"
            :min="0"
            :precision="2"
            :show-button="false"
            style="width: 100%"
          /> </NFormItem
        ><NFormItem label="Đơn vị" path="unit" required>
          <EmployeeRequestPolicyUnitSelect v-model:value="model.unit" />
        </NFormItem>
      </div>
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
      <NFormItem label="Tính lương" path="paid">
        <NSwitch v-model:value="model.paid" />
      </NFormItem>
      <NDivider title-placement="left">Quyền lợi phép</NDivider>
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
            >+1 ngày mỗi 5 năm làm việc</span
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
        > </NFormItem
      ><NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton
        ><NButton type="primary" @click="submit">Lưu</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
