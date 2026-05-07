<script setup lang="ts">
import type {
  ContractSalaryField,
  ContractSalaryForm,
  ContractSalaryValue,
} from "#/models/hr/contract";

import { NDivider, NFormItem, NInput } from "naive-ui";

const props = defineProps<{
  form: ContractSalaryForm;
  numberFormatter: (value: ContractSalaryValue) => string;
  numberParser: (value: string) => ContractSalaryValue;
}>();

const emit = defineEmits<{
  salaryFieldChange: [field: ContractSalaryField, value: null | number];
}>();

function getNumberValue(field: ContractSalaryField) {
  const value = props.form[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function parseMoneyValue(value: string) {
  const parsedValue = props.numberParser(value);

  if (typeof parsedValue === "number" && Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  if (typeof parsedValue === "string" && parsedValue.trim()) {
    const numericValue = Number(parsedValue);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function getFormattedValue(field: ContractSalaryField) {
  return props.numberFormatter(getNumberValue(field));
}

function updateField(field: ContractSalaryField, value: null | number) {
  emit("salaryFieldChange", field, value);
}

function updateMoneyField(field: ContractSalaryField, value: string) {
  updateField(field, parseMoneyValue(value));
}
</script>

<template>
  <div class="contract-salary-info">
    <NDivider title-placement="left">Thông tin lương</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem label="Lương gross">
        <NInput
          inputmode="decimal"
          placeholder="Lương gross"
          style="width: 100%"
          :value="getFormattedValue('salaryGross')"
          @update:value="(value) => updateMoneyField('salaryGross', value)"
        />
      </NFormItem>

      <NFormItem label="Lương cơ bản">
        <NInput
          disabled
          placeholder="Tự tính theo mức đóng bảo hiểm"
          style="width: 100%"
          :value="getFormattedValue('basicSalary')"
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
    </div>
  </div>
</template>

<style scoped>
.contract-salary-info,
.grid {
  width: 100%;
}
</style>
