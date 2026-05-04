<script setup lang="ts">
import { NDivider, NFormItem, NInputNumber } from 'naive-ui';

type ContractBusinessCostValue = null | number | string | undefined;
type ContractBusinessCostField =
  | 'businessCalculateOccAccInsuranceFee'
  | 'businessHealthInsuranceFee'
  | 'businessSocialInsuranceFee'
  | 'businessUnemploymentInsuranceFee'
  | 'totalCost';

type ContractBusinessCostsForm = Partial<
  Record<ContractBusinessCostField, ContractBusinessCostValue>
> &
  Record<string, unknown>;

interface CostItem {
  field: ContractBusinessCostField;
  label: string;
}

const props = defineProps<{
  form: ContractBusinessCostsForm;
  numberFormatter: (value: ContractBusinessCostValue) => string;
  numberParser: (value: string) => ContractBusinessCostValue;
}>();

const emit = defineEmits<{
  'update:form': [value: ContractBusinessCostsForm];
}>();

const costItems: CostItem[] = [
  {
    field: 'businessSocialInsuranceFee',
    label: 'BHXH doanh nghiệp',
  },
  {
    field: 'businessCalculateOccAccInsuranceFee',
    label: 'BHTNLĐ-BNN doanh nghiệp',
  },
  {
    field: 'businessHealthInsuranceFee',
    label: 'BHYT doanh nghiệp',
  },
  {
    field: 'businessUnemploymentInsuranceFee',
    label: 'BHTN doanh nghiệp',
  },
  {
    field: 'totalCost',
    label: 'Tổng chi phí',
  },
];

function getNumberValue(field: ContractBusinessCostField) {
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

function parseNumber(value: string) {
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

function updateField(field: ContractBusinessCostField, value: null | number) {
  emit('update:form', {
    ...props.form,
    [field]: value,
  });
}
</script>

<template>
  <div class="contract-business-costs">
    <NDivider title-placement="left">Chi phí doanh nghiệp</NDivider>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <NFormItem
        v-for="item in costItems"
        :key="item.field"
        :label="item.label"
      >
        <NInputNumber
          :format="numberFormatter"
          :min="0"
          :parse="parseNumber"
          :show-button="false"
          :update-value-on-input="true"
          style="width: 100%"
          :value="getNumberValue(item.field)"
          @update:value="(value) => updateField(item.field, value)"
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
