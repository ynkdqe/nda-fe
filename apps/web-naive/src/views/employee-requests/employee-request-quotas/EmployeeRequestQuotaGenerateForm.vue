<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui';

import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestQuotaApi } from '#/models/employee-requests/employee-request-quota';

import { nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
} from 'naive-ui';

const emit = defineEmits<{
  submit: [EmployeeRequestQuotaApi.GenerateInput];
}>();
const formRef = ref<FormInst | null>(null);
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
const model = reactive({
  employeeRequestPolicyId: null as null | number,
  year: new Date().getFullYear(),
});
const rules: FormRules = {
  employeeRequestPolicyId: {
    required: true,
    type: 'number',
    message: 'Vui lòng chọn chính sách',
    trigger: 'change',
  },
  year: {
    required: true,
    type: 'number',
    message: 'Vui lòng nhập năm',
    trigger: ['blur', 'change'],
  },
};
async function submit() {
  await formRef.value?.validate();
  if (model.employeeRequestPolicyId === null) return;
  emit('submit', {
    employeeRequestPolicyId: model.employeeRequestPolicyId,
    year: model.year,
  });
}
const [Drawer, drawerApi] = useVbenDrawer({
  showConfirmButton: false,
  onOpenChange(open) {
    if (!open) return;
    const d = drawerApi.getData<{
      policies: EmployeeRequestPolicyApi.Item[];
      year: number;
    }>();
    policies.value = d.policies;
    Object.assign(model, {
      employeeRequestPolicyId: null,
      year: d.year,
    });
    void nextTick(() => formRef.value?.restoreValidation());
  },
});
</script>
<template>
  <Drawer class="md:w-[480px]" title="Cấp quyền lợi phép">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="top"
      class="p-4 pb-20"
    >
      <NAlert class="mb-4" type="info">
        Hệ thống chỉ tạo cho nhân viên chưa có dữ liệu của năm này, nên chạy lại
        nhiều lần không làm mất các điều chỉnh đã nhập.
      </NAlert>
      <NFormItem label="Chính sách" path="employeeRequestPolicyId" required>
        <NSelect
          v-model:value="model.employeeRequestPolicyId"
          :options="
            policies.map((x) => ({
              label: `${x.employeeRequestTypeName ?? ''} - ${x.employeeRequestReasonName ?? ''} (${x.maxTime} ${x.unit === 'Hour' ? 'giờ' : 'ngày'})`,
              value: x.id,
            }))
          "
          clearable
          filterable
          placeholder="Chọn chính sách cần cấp phép"
        />
      </NFormItem>
      <NFormItem label="Năm" path="year" required>
        <NInputNumber
          v-model:value="model.year"
          :max="2100"
          :min="2000"
          :show-button="false"
          style="width: 100%"
        />
      </NFormItem>
      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton
        ><NButton type="primary" @click="submit">Cấp phép</NButton>
      </NSpace>
    </NForm>
  </Drawer>
</template>
