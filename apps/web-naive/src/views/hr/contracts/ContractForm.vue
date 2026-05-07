<script lang="ts" setup>
import type {
  ContractApi,
  ContractFormModel,
  ContractSalaryField,
  ContractSelectOption,
  ContractTypeItem,
  EmployeeUpdateValue,
  Id,
  NullableNumber,
  UnknownRecord,
} from "#/models/hr/contract";
import type { ContractSalaryChangedField } from "#/utils/contract-salary";

import { computed, reactive, ref, watch } from "vue";

import { useVbenDrawer } from "@vben/common-ui";
import { formatDate } from "@vben/utils";

import { NDatePicker, NForm, NFormItem, NSelect } from "naive-ui";

import { message } from "#/adapter/naive";
import {
  calculateContractSalaryState,
  isContractSocialInsuranceEnabled,
} from "#/utils/contract-salary";

import ContractEmployerCosts from "./ContractBusinessCosts.vue";
import ContractEmployeeCosts from "./ContractEmployeeCosts.vue";
import ContractEmployeeInfo from "./ContractEmployeeInfo.vue";
import ContractSalaryInfo from "./ContractSalaryInfo.vue";
import ContractStatusApproval from "./ContractStatusApproval.vue";

const props = withDefaults(
  defineProps<{
    contractTypeList?: ContractTypeItem[];
    contractTypeOptions?: ContractSelectOption[];
    insuranceTypeOptions?: ContractSelectOption[];
    loading?: boolean;
    modelValue?: Partial<ContractFormModel>;
  }>(),
  {
    contractTypeList: undefined,
    contractTypeOptions: undefined,
    insuranceTypeOptions: undefined,
    loading: false,
    modelValue: undefined,
  },
);

const emit = defineEmits<{
  cancel: [];
  submit: [value: UnknownRecord];
  "update:modelValue": [value: Partial<ContractFormModel>];
}>();

function createInitialForm(): ContractFormModel {
  return {
    allowance: 0,
    approver: undefined,
    basicSalary: null,
    birthDate: null,
    businessCalculateOccAccInsuranceFee: null,
    businessHealthInsuranceFee: null,
    businessSocialInsuranceFee: null,
    businessUnemploymentInsuranceFee: null,
    checkers: [],
    contractCode: null,
    contractName: null,
    contractTypeId: undefined,
    effectiveDate: null,
    email: null,
    employeeCode: null,
    employeeHealthInsuranceFee: null,
    employeeId: undefined,
    employeeName: null,
    employeeSocialInsuranceFee: null,
    employeeUnionFee: null,
    employeeUnemploymentInsuranceFee: null,
    expiryDate: null,
    id: undefined,
    identification: null,
    insuranceSalary: null,
    insuranceType: 2,
    insuranceValue: 100,
    kpi: 0,
    notes: null,
    phone: null,
    salaryGross: null,
    salaryNet: null,
    status: 1,
    tax: null,
    taxCode: null,
    taxFee: null,
    totalCost: null,
  };
}

const form = reactive<ContractFormModel>(createInitialForm());
const contractTypes = ref<ContractSelectOption[]>([]);
const contractTypeItems = ref<ContractTypeItem[]>([]);
const selectedContractType = ref<ContractTypeItem | null>(null);
const selectedDurationValue = ref<null | number>(null);
const statusOptions = ref<ContractSelectOption[]>([]);
const lastManualSalaryComponent = ref<"allowance" | "kpi" | null>(null);
const FIXED_INSURANCE_PERCENT = 100;
const FIXED_INSURANCE_TYPE = 2;

const defaultInsuranceTypes = computed<ContractSelectOption[]>(() => [
  { label: "Cố định", value: 1 },
  { label: "%", value: 2 },
]);

const insuranceTypes = computed(() => props.insuranceTypeOptions ?? defaultInsuranceTypes.value);
const hasSocialInsurance = computed(() =>
  isContractSocialInsuranceEnabled(selectedContractType.value, form.salaryGross),
);
const isTaxFixed = computed(() => Boolean(selectedContractType.value?.isTaxFixed));

const durationsOptions = computed<ContractSelectOption[]>(() => {
  if (!form.contractTypeId) {
    return [];
  }

  const contractType = contractTypeItems.value.find(
    (item) => String(item.id) === String(form.contractTypeId),
  );
  const durations = getContractDurations(contractType);

  return durations.map((duration) => {
    const value = toNumber(duration.duration, 0);
    return {
      label: duration.name ?? String(duration.duration ?? ""),
      value,
    };
  });
});

const feesTotal = computed(() => {
  return (
    toNumber(form.employeeSocialInsuranceFee, 0) +
    toNumber(form.employeeHealthInsuranceFee, 0) +
    toNumber(form.employeeUnemploymentInsuranceFee, 0) +
    toNumber(form.taxFee, 0)
  );
});

const title = computed(() => (form.id ? "Sửa hợp đồng" : "Tạo hợp đồng"));

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  return fallback;
}

function toTimestamp(value: unknown): NullableNumber {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  return null;
}

function toDateString(value: unknown) {
  const timestamp = toTimestamp(value) ?? Date.now();
  return formatDate(timestamp, "YYYY-MM-DD");
}

function getRecordValue(record: UnknownRecord, key: string) {
  return record[key];
}

function getStringValue(record: UnknownRecord, key: string) {
  const value = getRecordValue(record, key);
  return typeof value === "string" ? value : null;
}

function getIdValue(record: UnknownRecord, key: string): Id | undefined {
  const value = getRecordValue(record, key);

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
}

function getNumberValue(record: UnknownRecord, key: string): NullableNumber {
  const value = getRecordValue(record, key);

  if (value === null || value === undefined || value === "") {
    return null;
  }

  return toNumber(value, 0);
}

function normalizeRecord(
  record?: null | Partial<ContractApi.ContractItem> | Partial<ContractFormModel>,
) {
  const initialValue = createInitialForm();

  if (!record || !isRecord(record)) {
    return initialValue;
  }

  return {
    ...initialValue,
    ...record,
    allowance: getNumberValue(record, "allowance"),
    approver: getIdValue(record, "approver"),
    basicSalary: getNumberValue(record, "basicSalary"),
    birthDate: getStringValue(record, "birthDate"),
    checkers: Array.isArray(getRecordValue(record, "checkers"))
      ? (getRecordValue(record, "checkers") as Id[])
      : [],
    contractName: getStringValue(record, "contractName") ?? getStringValue(record, "name"),
    contractTypeId: getIdValue(record, "contractTypeId") ?? getIdValue(record, "contractType"),
    effectiveDate: toTimestamp(record.effectiveDate),
    employeeCode: getStringValue(record, "employeeCode"),
    employeeId: getIdValue(record, "employeeId"),
    employeeName: getStringValue(record, "employeeName"),
    expiryDate: toTimestamp(record.expiryDate),
    insuranceType: getIdValue(record, "insuranceType") ?? FIXED_INSURANCE_TYPE,
    insuranceValue:
      getNumberValue(record, "insuranceValue") ??
      getNumberValue(record, "insurance") ??
      FIXED_INSURANCE_PERCENT,
    kpi: getNumberValue(record, "kpi"),
    notes: getStringValue(record, "notes") ?? getStringValue(record, "note"),
    salaryGross: getNumberValue(record, "salaryGross") ?? getNumberValue(record, "totalSalary"),
    status: getIdValue(record, "status") ?? 1,
    taxCode: getNumberValue(record, "taxCode"),
    totalCost: getNumberValue(record, "totalCost"),
  } satisfies ContractFormModel;
}

function getContractDurations(contractType?: ContractTypeItem | null) {
  if (!contractType) {
    return [];
  }

  const durations =
    contractType.durations ??
    contractType.extraProperties?.durations ??
    contractType.contractDurations ??
    [];

  return Array.isArray(durations) ? durations : [];
}

function syncSelectedDurationFromContractName() {
  if (!form.contractName) {
    selectedDurationValue.value = null;
    return;
  }

  const contractName = String(form.contractName).trim();
  const durations = getContractDurations(selectedContractType.value);
  const matchedDuration = durations.find((duration) => {
    const durationName = String(duration.name ?? "").trim();
    return durationName === contractName || String(duration.duration ?? "") === contractName;
  });

  selectedDurationValue.value = matchedDuration ? toNumber(matchedDuration.duration, 0) : null;
}

function mapToOptions(list: UnknownRecord[]): ContractSelectOption[] {
  const options: ContractSelectOption[] = [];

  for (const item of list) {
    const value = getIdValue(item, "id");

    if (value === undefined) {
      continue;
    }

    options.push({
      label: getStringValue(item, "name") ?? String(value),
      value,
    });
  }

  return options;
}

async function loadContractTypes() {
  const list = props.contractTypeList ?? contractTypeItems.value;
  const apiOptions = mapToOptions(list);

  contractTypeItems.value = list;
  contractTypes.value =
    apiOptions.length > 0 ? apiOptions : (props.contractTypeOptions ?? contractTypes.value);

  if (form.contractTypeId) {
    await loadSelectedContractType(form.contractTypeId);
    syncSalaryStructure("contractType");
    syncSelectedDurationFromContractName();
  }
}

async function loadSelectedContractType(contractTypeId?: Id) {
  if (!contractTypeId) {
    selectedContractType.value = null;
    return;
  }

  syncSelectedContractType();
}

function numberFormatter(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberParser(value: string) {
  return value ? value.replaceAll(",", "") : value;
}

function syncSalaryStructure(changedField: ContractSalaryChangedField = "init") {
  const result = calculateContractSalaryState({
    changedField,
    contractType: selectedContractType.value,
    form,
    lastManualSalaryComponent: lastManualSalaryComponent.value,
  });

  Object.assign(form, result.form);
}

function handleSalaryFieldChange(field: ContractSalaryField, value: null | number) {
  form[field] = value;

  if (field === "allowance" || field === "kpi") {
    lastManualSalaryComponent.value = field;
  }

  if (["allowance", "kpi", "salaryGross"].includes(field)) {
    syncSalaryStructure(field);
  }
}

function handleEmployeeCostsUpdate(value: Record<string, unknown>) {
  let changedField: ContractSalaryChangedField = "insuranceValue";

  if (value.tax !== form.tax) {
    changedField = "tax";
  } else if (value.insuranceType !== form.insuranceType) {
    changedField = "insuranceType";
  }

  Object.assign(form, value);
  syncSalaryStructure(changedField);
}

function syncSelectedContractType() {
  selectedContractType.value =
    contractTypeItems.value.find((item) => String(item.id) === String(form.contractTypeId)) ?? null;
}

async function onContractTypeChange(value: Id | null) {
  form.contractTypeId = value ?? undefined;
  form.contractName = null;
  selectedDurationValue.value = null;
  await loadSelectedContractType(form.contractTypeId);
  syncSalaryStructure("contractType");
  syncSelectedDurationFromContractName();
}

function normalizeEmployeeId(value: EmployeeUpdateValue) {
  const employeeId = Array.isArray(value) ? value[0] : value;

  if (employeeId === null || employeeId === undefined) {
    return undefined;
  }

  return employeeId;
}

function onEmployeeModelValueUpdate(value: EmployeeUpdateValue) {
  form.employeeId = normalizeEmployeeId(value);
}

function onEmployeeChange(value: EmployeeUpdateValue, option?: unknown) {
  const employeeId = normalizeEmployeeId(value);

  if (employeeId === undefined) {
    return;
  }

  const selectedOption = Array.isArray(option) ? option[0] : option;

  form.employeeId = employeeId;

  if (isRecord(selectedOption)) {
    form.employeeName = getStringValue(selectedOption, "name") ?? "";
    form.employeeCode = getStringValue(selectedOption, "userName") ?? "";
    form.email = getStringValue(selectedOption, "email") ?? "";
    form.phone = getStringValue(selectedOption, "phone") ?? "";
    form.identification = getStringValue(selectedOption, "identification") ?? "";
    form.birthDate = getStringValue(selectedOption, "birthDate");
    form.taxCode = getNumberValue(selectedOption, "taxCode");
  }
}

function onDurationChange(value: null | number) {
  selectedDurationValue.value = value;

  if (value === null) {
    form.contractName = null;
    return;
  }

  const durations = getContractDurations(selectedContractType.value);
  const duration = durations.find((item) => toNumber(item.duration, 0) === Number(value));

  form.contractName = duration?.name ?? String(value);
  applyDuration(value);
}

function applyDuration(months: number) {
  const now = Date.now();
  form.effectiveDate = now;

  if (months === 0) {
    form.expiryDate = null;
    message.success("Đã đặt hiệu lực hôm nay, vô thời hạn");
    return;
  }

  const expiryDate = new Date(now);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  form.expiryDate = expiryDate.getTime();
  message.success(`Đã đặt hiệu lực hôm nay, hết hạn sau ${months} tháng`);
}

function handleSubmit() {
  const payload: UnknownRecord = {
    allowance: form.allowance ?? 0,
    approver: form.approver,
    basicSalary: form.basicSalary ?? 0,
    businessCalculateOccAccInsuranceFee: form.businessCalculateOccAccInsuranceFee ?? 0,
    businessHealthInsuranceFee: form.businessHealthInsuranceFee ?? 0,
    businessSocialInsuranceFee: form.businessSocialInsuranceFee ?? 0,
    businessUnemploymentInsuranceFee: form.businessUnemploymentInsuranceFee ?? 0,
    checkers: form.checkers,
    contractName: form.contractName,
    contractTypeId: form.contractTypeId,
    effectiveDate: toDateString(form.effectiveDate),
    employeeId: form.employeeId,

    expiryDate: form.expiryDate ? toDateString(form.expiryDate) : null,
    insurance: form.insuranceValue ?? 0,
    insuranceSalary: form.insuranceSalary ?? 0,
    insuranceType: form.insuranceType,
    insuranceValue: form.insuranceValue ?? 0,
    kpi: form.kpi ?? 0,
    note: form.notes ?? "",
    salaryNet: form.salaryNet ?? 0,
    status: form.status,
    tax: form.tax ?? 0,
    taxCode: form.taxCode ?? 0,
    taxFee: form.taxFee ?? 0,
    totalCost: form.totalCost ?? 0,
    totalSalary: form.salaryGross ?? 0,
  };

  emit("submit", payload);
  emit("update:modelValue", { ...form });
}

function resetFormWithRecord(record?: null | Partial<ContractApi.ContractItem>) {
  lastManualSalaryComponent.value = null;
  Object.assign(form, normalizeRecord(record));
  syncSelectedContractType();
  syncSalaryStructure("init");
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    emit("cancel");
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{
        contractTypeList?: ContractTypeItem[];
        contractTypes?: ContractSelectOption[];
        record: null | Partial<ContractApi.ContractItem>;
        statusOptions?: ContractSelectOption[];
      }>();

      const drawerContractTypeList = data.contractTypeList ?? [];
      const drawerContractTypes = data.contractTypes ?? [];
      const drawerStatusOptions = data.statusOptions ?? [];

      if (drawerContractTypeList.length > 0) {
        contractTypeItems.value = drawerContractTypeList;
      }

      if (drawerContractTypes.length > 0) {
        contractTypes.value = drawerContractTypes;
      }

      if (drawerStatusOptions.length > 0) {
        statusOptions.value = drawerStatusOptions;
      }

      resetFormWithRecord(data.record);
      void loadContractTypes();
      return;
    }

    lastManualSalaryComponent.value = null;
    Object.assign(form, createInitialForm());
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      lastManualSalaryComponent.value = null;
      Object.assign(form, normalizeRecord(value));
      syncSelectedContractType();
      syncSalaryStructure("init");
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => props.contractTypeOptions,
  (options) => {
    if (options) {
      contractTypes.value = options;
    }
  },
  { immediate: true },
);

watch(
  () => props.contractTypeList,
  (list) => {
    if (list) {
      contractTypeItems.value = list;
      contractTypes.value = mapToOptions(list);
    }
  },
  { immediate: true },
);

void loadContractTypes();
</script>

<template>
  <Drawer :title="title" class="md:w-[1200px]">
    <NForm class="p-2" label-placement="top">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <NFormItem label="Loại hợp đồng" path="contractTypeId">
          <NSelect
            clearable
            :options="contractTypes"
            placeholder="Chọn loại hợp đồng"
            :value="form.contractTypeId"
            @update:value="onContractTypeChange"
          />
        </NFormItem>

        <NFormItem label="Thời hạn" path="contractName">
          <NSelect
            clearable
            :options="durationsOptions"
            placeholder="Thời hạn"
            :value="selectedDurationValue"
            @update:value="onDurationChange"
          />
        </NFormItem>

        <NFormItem label="Hiệu lực">
          <NDatePicker
            v-model:value="form.effectiveDate"
            clearable
            format="dd-MM-yyyy"
            placeholder="DD-MM-YYYY"
            style="width: 100%"
            type="date"
          />
        </NFormItem>

        <NFormItem label="Hết hạn">
          <NDatePicker
            v-model:value="form.expiryDate"
            clearable
            format="dd-MM-yyyy"
            placeholder="DD-MM-YYYY"
            style="width: 100%"
            type="date"
          />
        </NFormItem>
      </div>

      <ContractEmployeeInfo
        :form="form"
        @change="onEmployeeChange"
        @update:form="(value) => Object.assign(form, value)"
        @update:model-value="onEmployeeModelValueUpdate"
      />

      <ContractSalaryInfo
        :form="form"
        :number-formatter="numberFormatter"
        :number-parser="numberParser"
        @salary-field-change="handleSalaryFieldChange"
      />

      <ContractEmployeeCosts
        :fees-total="feesTotal"
        :form="form"
        :has-social-insurance="hasSocialInsurance"
        :insurance-types="insuranceTypes"
        :is-tax-fixed="isTaxFixed"
        :number-formatter="numberFormatter"
        :number-parser="numberParser"
        @update:form="handleEmployeeCostsUpdate"
      />

      <ContractEmployerCosts
        :form="form"
        :number-formatter="numberFormatter"
        :number-parser="numberParser"
        @update:form="(value) => Object.assign(form, value)"
      />

      <ContractStatusApproval
        :form="form"
        :status-options="statusOptions"
        @update:form="(value) => Object.assign(form, value)"
      />
    </NForm>
  </Drawer>
</template>

<style scoped>
.grid {
  width: 100%;
}
</style>
