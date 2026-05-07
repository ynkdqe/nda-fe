<script setup lang="ts">
import type {
  ContractEmployeeInfoField,
  ContractEmployeeInfoForm,
  ContractEmployeeInfoValue,
} from "#/models/hr/contract";

import { formatDate } from "@vben/utils";

import { NDivider, NFormItem, NInput } from "naive-ui";

import EmployeeSearchSelect from "#/components/EmployeeSearchSelect.vue";

const props = defineProps<{
  form: ContractEmployeeInfoForm;
}>();

const emit = defineEmits<{
  change: [value: ContractEmployeeInfoValue | ContractEmployeeInfoValue[], option?: unknown];
  "update:form": [value: ContractEmployeeInfoForm];
  "update:modelValue": [value: ContractEmployeeInfoValue | ContractEmployeeInfoValue[]];
}>();

function updateField(field: ContractEmployeeInfoField, value: ContractEmployeeInfoValue) {
  emit("update:form", {
    ...props.form,
    [field]: value,
  });
}

function getTextValue(field: ContractEmployeeInfoField) {
  const value = props.form[field];
  return value === null || value === undefined ? "" : String(value);
}

function getNumberValue(field: ContractEmployeeInfoField) {
  const value = props.form[field];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value.replaceAll(",", ""));
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function formatNumber(value?: null | number) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value.replaceAll(",", ""));
  return Number.isNaN(numericValue) ? null : numericValue;
}

function getFormattedNumberValue(field: ContractEmployeeInfoField) {
  return formatNumber(getNumberValue(field));
}

function getEmployeeIdValue() {
  const value = props.form.employeeId;

  if (value === null || value === undefined) {
    return undefined;
  }

  return String(value);
}

function formatBirthDate() {
  const value = props.form.birthDate;

  if (value === null || value === undefined || value === "") {
    return "";
  }

  return formatDate(value, "DD/MM/YYYY");
}

function onEmployeeChange(
  value: ContractEmployeeInfoValue | ContractEmployeeInfoValue[],
  option?: unknown,
) {
  emit("change", value, option);
}

function onEmployeeModelUpdate(value: ContractEmployeeInfoValue | ContractEmployeeInfoValue[]) {
  emit("update:modelValue", value);
  updateField("employeeId", Array.isArray(value) ? value[0] : value);
}
</script>

<template>
  <div class="contract-employee-info">
    <NDivider title-placement="left">Thông tin nhân viên</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem label="Nhân viên" path="employeeId">
        <EmployeeSearchSelect
          mode="single"
          :model-value="getEmployeeIdValue()"
          placeholder="Chọn nhân viên"
          @change="onEmployeeChange"
          @update:model-value="onEmployeeModelUpdate"
        />
      </NFormItem>

      <NFormItem label="Số điện thoại">
        <NInput :value="getTextValue('phone')" readonly />
      </NFormItem>

      <NFormItem label="Email">
        <NInput :value="getTextValue('email')" readonly />
      </NFormItem>

      <NFormItem label="CMND/CCCD">
        <NInput :value="getTextValue('identification')" readonly />
      </NFormItem>

      <NFormItem label="Ngày sinh">
        <NInput :value="formatBirthDate()" readonly />
      </NFormItem>

      <NFormItem label="Mã số thuế">
        <NInput
          inputmode="decimal"
          style="width: 100%"
          :value="getFormattedNumberValue('taxCode')"
          @update:value="(value) => updateField('taxCode', parseNumber(value))"
        />
      </NFormItem>
    </div>
  </div>
</template>

<style scoped>
.contract-employee-info,
.grid {
  width: 100%;
}
</style>
