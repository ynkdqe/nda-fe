<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestPolicyApi } from '#/models/hr/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/hr/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/hr/employee-request-type';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NSwitch,
} from 'naive-ui';

import EmployeeRequestPolicyUnitSelect from '../components/EmployeeRequestPolicyUnitSelect.vue';
import EmployeeRequestReasonSelect from '../components/EmployeeRequestReasonSelect.vue';
import EmployeeRequestTypeSelect from '../components/EmployeeRequestTypeSelect.vue';
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
  id: undefined as number | undefined,
  maxTime: null as null | number,
  paid: false,
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
async function submit() {
  await formRef.value?.validate();
  if (
    model.employeeRequestReasonId === null ||
    model.employeeRequestTypeId === null ||
    model.maxTime === null
  ) {
    return;
  }

  const base = {
    employeeRequestReasonId: model.employeeRequestReasonId,
    employeeRequestTypeId: model.employeeRequestTypeId,
    maxTime: model.maxTime,
    paid: model.paid,
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
      id: d.record?.id,
      maxTime: d.record?.maxTime ?? null,
      paid: d.record?.paid ?? false,
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
/>
</NFormItem><NFormItem label="Lý do" path="employeeRequestReasonId" required>
<EmployeeRequestReasonSelect
          v-model:value="model.employeeRequestReasonId"
          :employee-request-type-id="model.employeeRequestTypeId"
          :options="reasons"
/>
</NFormItem><NAlert v-if="duplicate" type="warning" class="mb-4">
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
/>
</NFormItem><NFormItem label="Đơn vị" path="unit" required>
<EmployeeRequestPolicyUnitSelect v-model:value="model.unit" />
</NFormItem>
      </div>
      <NFormItem label="Tính lương" path="paid">
<NSwitch v-model:value="model.paid" />
</NFormItem><NSpace justify="end">
<NButton @click="drawerApi.close()">Hủy</NButton><NButton type="primary" @click="submit">Lưu</NButton>
</NSpace>
</NForm>
</Drawer>
</template>
