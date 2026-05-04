<script setup lang="ts">
import { NDivider, NFormItem, NInput } from 'naive-ui';

type ContractSalaryValue = null | number | string | undefined;
type ContractSalaryField = 'allowance' | 'basicSalary' | 'kpi' | 'salaryGross';

type ContractSalaryForm = Partial<
  Record<ContractSalaryField, ContractSalaryValue>
> &
  Record<string, unknown>;

const props = defineProps<{
  form: ContractSalaryForm;
  numberFormatter: (value: ContractSalaryValue) => string;
  numberParser: (value: string) => ContractSalaryValue;
}>();

const emit = defineEmits<{
  'update:form': [value: ContractSalaryForm];
}>();

function getNumberValue(field: ContractSalaryField) {
  const value = props.form[field];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function parseMoneyValue(value: string) {
  const parsedValue = props.numberParser(value);

  if (typeof parsedValue === 'number' && Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  if (typeof parsedValue === 'string' && parsedValue.trim()) {
    const numericValue = Number(parsedValue);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function getFormattedValue(field: ContractSalaryField) {
  return props.numberFormatter(getNumberValue(field));
}

function updateField(field: ContractSalaryField, value: null | number) {
  emit('update:form', {
    ...props.form,
    [field]: value,
  });
}

function updateMoneyField(field: ContractSalaryField, value: string) {
  updateField(field, parseMoneyValue(value));
}
</script>

<template>
  <div class="contract-salary-info">
    <NDivider title-placement="left">Thông tin lương</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem label="Lương cơ bản">
        <NInput
          inputmode="decimal"
          placeholder="Lương cơ bản"
          style="width: 100%"
          :value="getFormattedValue('basicSalary')"
          @update:value="(value) => updateMoneyField('basicSalary', value)"
        />
      </NFormItem>

      <NFormItem label="KPI & Phụ cấp">
        <div class="flex w-full flex-wrap gap-2 md:flex-nowrap">
          <NInput
            class="min-w-0 flex-1"
            inputmode="decimal"
            placeholder="Phụ cấp"
            :value="getFormattedValue('allowance')"
            @update:value="(value) => updateMoneyField('allowance', value)"
          />
          <NInput
            class="min-w-0 flex-1"
            inputmode="decimal"
            placeholder="KPI"
            :value="getFormattedValue('kpi')"
            @update:value="(value) => updateMoneyField('kpi', value)"
          />
        </div>
      </NFormItem>

      <NFormItem label="Lương gross">
        <NInput
          disabled
          style="width: 100%"
          :value="getFormattedValue('salaryGross')"
        />
      </NFormItem>
    </div>
  </div>
</template>

<style scoped>
.contract-salary-info,
.grid {
  width: 100%;
}
</style>
