<script setup lang="ts">
import type {
  ContractBusinessCostField,
  ContractBusinessCostItem,
  ContractBusinessCostsForm,
  ContractBusinessCostValue,
} from "#/models/hr/contract";

import { NDivider, NFormItem, NInput } from "naive-ui";

const props = defineProps<{
  form: ContractBusinessCostsForm;
  numberFormatter: (value: ContractBusinessCostValue) => string;
  numberParser: (value: string) => ContractBusinessCostValue;
}>();

const emit = defineEmits<{
  "update:form": [value: ContractBusinessCostsForm];
}>();

const costItems: ContractBusinessCostItem[] = [
  {
    field: "businessSocialInsuranceFee",
    label: "BHXH doanh nghiệp",
  },
  {
    field: "businessCalculateOccAccInsuranceFee",
    label: "BHTNLĐ-BNN doanh nghiệp",
  },
  {
    field: "businessHealthInsuranceFee",
    label: "BHYT doanh nghiệp",
  },
  {
    field: "businessUnemploymentInsuranceFee",
    label: "BHTN doanh nghiệp",
  },
  {
    field: "totalCost",
    label: "Tổng chi phí",
  },
];

function getNumberValue(field: ContractBusinessCostField) {
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

function parseNumber(value: string) {
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

function getFormattedValue(field: ContractBusinessCostField) {
  return props.numberFormatter(getNumberValue(field));
}

function updateField(field: ContractBusinessCostField, value: null | number) {
  emit("update:form", {
    ...props.form,
    [field]: value,
  });
}

function updateMoneyField(field: ContractBusinessCostField, value: string) {
  updateField(field, parseNumber(value));
}
</script>

<template>
  <div class="contract-business-costs">
    <NDivider title-placement="left">Chi phí doanh nghiệp</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem v-for="item in costItems" :key="item.field" :label="item.label">
        <NInput
          inputmode="decimal"
          style="width: 100%"
          :value="getFormattedValue(item.field)"
          @update:value="(value) => updateMoneyField(item.field, value)"
        />
      </NFormItem>
    </div>
  </div>
</template>

<style scoped>
.contract-business-costs,
.grid {
  width: 100%;
}
</style>
