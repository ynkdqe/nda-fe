<script setup lang="ts">
import type { SelectOption } from "naive-ui";

import type {
  ContractEmployeeCostField,
  ContractEmployeeCostsForm,
  ContractEmployeeCostValue,
  ContractEmployeeFeeItem,
} from "#/models/hr/contract";

import { computed } from "vue";

import { NDivider, NFormItem, NInputNumber, NSelect } from "naive-ui";

const props = defineProps<{
  feesTotal: number;
  form: ContractEmployeeCostsForm;
  insuranceTypes: SelectOption[];
  numberFormatter: (value: ContractEmployeeCostValue) => string;
  numberParser: (value: string) => ContractEmployeeCostValue;
}>();

const emit = defineEmits<{
  insuranceValueChange: [value: number];
  "update:form": [value: ContractEmployeeCostsForm];
}>();

const insuranceSalaryHelpText = computed(() => {
  if (props.form.insuranceSalary === undefined || props.form.insuranceSalary === null) {
    return undefined;
  }

  return `Lương đóng bảo hiểm: ${props.numberFormatter(props.form.insuranceSalary)}`;
});

const feeItems: ContractEmployeeFeeItem[] = [
  {
    field: "employeeSocialInsuranceFee",
    label: "BHXH nhân viên",
    placeholder: "Xã hội",
  },
  {
    field: "employeeHealthInsuranceFee",
    label: "BHYT nhân viên",
  },
  {
    field: "employeeUnemploymentInsuranceFee",
    label: "BHTN nhân viên",
  },

  {
    field: "taxFee",
    label: "Thuế TNCN",
  },
];

function getSelectValue(field: ContractEmployeeCostField) {
  const value = props.form[field];
  return value === undefined ? null : value;
}

function getNumberValue(field: ContractEmployeeCostField) {
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

function updateField(field: ContractEmployeeCostField, value: ContractEmployeeCostValue) {
  emit("update:form", {
    ...props.form,
    [field]: value,
  });

  if (field === "insuranceValue" && typeof value === "number") {
    emit("insuranceValueChange", value);
  }
}
</script>

<template>
  <div class="contract-employee-costs">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NDivider title-placement="left">Chi phí nhân viên</NDivider>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem label="Bảo hiểm" :feedback="insuranceSalaryHelpText">
        <div class="-mx-1 flex w-full flex-wrap">
          <div class="w-full px-1 md:w-2/5">
            <div class="mb-1 text-xs text-gray-500">Loại bảo hiểm</div>
            <NSelect
              class="w-full"
              clearable
              :options="insuranceTypes"
              :value="getSelectValue('insuranceType')"
              @update:value="(value) => updateField('insuranceType', value)"
            />
          </div>

          <div class="w-full px-1 md:w-3/5">
            <div class="mb-1 text-xs text-gray-500">Mức đóng bảo hiểm</div>
            <NInputNumber
              :format="numberFormatter"
              :min="0"
              :parse="parseNumber"
              placeholder="Mức đóng bảo hiểm"
              :show-button="false"
              :update-value-on-input="true"
              style="width: 100%"
              :value="getNumberValue('insuranceValue')"
              @update:value="(value) => updateField('insuranceValue', value)"
            />
          </div>
        </div>
      </NFormItem>

      <NFormItem class="md:col-span-2" :feedback="`Tổng: ${numberFormatter(feesTotal)}`">
        <template #label>
          <span>Các khoản phí nhân viên</span>
        </template>

        <div class="grid w-full grid-cols-1 gap-3 md:grid-cols-4">
          <div v-for="item in feeItems" :key="item.field">
            <div class="mb-1 text-xs text-gray-500">{{ item.label }}</div>
            <NInputNumber
              :format="numberFormatter"
              :min="0"
              :parse="parseNumber"
              :placeholder="item.placeholder || item.label"
              :show-button="false"
              :update-value-on-input="true"
              style="width: 100%"
              :value="getNumberValue(item.field)"
              @update:value="(value) => updateField(item.field, value)"
            />
          </div>
        </div>
      </NFormItem>
    </div>
  </div>
</template>

<style scoped>
.contract-employee-costs,
.grid {
  width: 100%;
}
</style>
