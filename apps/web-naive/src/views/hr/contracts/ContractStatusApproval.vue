<script setup lang="ts">
import type {
  ContractStatusApprovalForm,
  ContractStatusField,
  ContractStatusOption,
  ContractStatusValue,
  EmployeeModelValue,
  EmployeeSelectValue,
} from '#/models/hr/contract';

import { NDivider, NFormItem, NInput, NSelect } from 'naive-ui';

import EmployeeSearchSelect from '#/components/EmployeeSearchSelect.vue';

const props = defineProps<{
  form: ContractStatusApprovalForm;
  statusOptions: ContractStatusOption[];
}>();

const emit = defineEmits<{
  'update:form': [value: ContractStatusApprovalForm];
}>();

function updateField(
  field: ContractStatusField,
  value: ContractStatusValue | EmployeeSelectValue[],
) {
  emit('update:form', {
    ...props.form,
    [field]: value,
  });
}

function getStatusValue() {
  const value = props.form.status;
  return value === null || value === undefined ? null : value;
}

function getEmployeeValue(field: 'approver' | 'checkers'): EmployeeModelValue {
  const value = props.form[field];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  return undefined;
}

function getNotesValue() {
  const value = props.form.notes;
  return typeof value === 'string' ? value : '';
}
</script>

<template>
  <div class="contract-status-approval">
    <NDivider title-placement="left">Trạng thái & phê duyệt</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem label="Trạng thái">
        <NSelect
          clearable
          :options="statusOptions"
          placeholder="Chọn trạng thái"
          style="width: 100%"
          :value="getStatusValue()"
          @update:value="(value) => updateField('status', value)"
        />
      </NFormItem>

      <NFormItem label="Người kiểm tra (Checkers)">
        <EmployeeSearchSelect
          mode="multiple"
          :model-value="getEmployeeValue('checkers')"
          placeholder="Chọn người kiểm tra"
          @update:model-value="(value) => updateField('checkers', value)"
        />
      </NFormItem>

      <NFormItem label="Người phê duyệt (Approver)">
        <EmployeeSearchSelect
          mode="single"
          :model-value="getEmployeeValue('approver')"
          placeholder="Chọn người phê duyệt"
          @update:model-value="(value) => updateField('approver', value)"
        />
      </NFormItem>

      <NFormItem class="md:col-span-3" label="Ghi chú">
        <NInput
          :rows="3"
          type="textarea"
          :value="getNotesValue()"
          @update:value="(value) => updateField('notes', value)"
        />
      </NFormItem>
    </div>
  </div>
</template>

<style scoped>
.contract-status-approval,
.grid {
  width: 100%;
}
</style>
