<script lang="ts" setup>
import type { SelectOption } from 'naive-ui';

import type { ContractApi } from '#/api';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { NDatePicker, NForm, NFormItem, NSelect } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getContractTypeByIdApi, getContractTypeListApi } from '#/api';
import { requestClient } from '#/api/request';

import ContractEmployerCosts from './ContractBusinessCosts.vue';
import ContractEmployeeCosts from './ContractEmployeeCosts.vue';
import ContractEmployeeInfo from './ContractEmployeeInfo.vue';
import ContractSalaryInfo from './ContractSalaryInfo.vue';
import ContractStatusApproval from './ContractStatusApproval.vue';

type Id = number | string;
type NullableString = null | string;
type NullableNumber = null | number;
type UnknownRecord = Record<string, unknown>;
type EmployeeUpdateValue = (Id | null | undefined)[] | Id | null | undefined;

type ContractSelectOption = Omit<SelectOption, 'value'> & {
  value: Id;
};

interface ContractDurationItem extends UnknownRecord {
  duration?: null | number | string;
  name?: null | string;
}

interface ContractTypeItem extends UnknownRecord {
  businessHealthInsurancePercent?: null | number | string;
  businessOccAccInsurancePercent?: null | number | string;
  businessSocialInsurancePercent?: null | number | string;
  businessUnemploymentInsurancePercent?: null | number | string;
  contractDurations?: ContractDurationItem[];
  durations?: ContractDurationItem[];
  employeeHealthInsurancePercent?: null | number | string;
  employeeMinTaxSalary?: null | number | string;
  employeeSocialInsurancePercent?: null | number | string;
  employeeUnionPercent?: null | number | string;
  employeeUnemployeeInsurancePercent?: null | number | string;
  extraProperties?: {
    durations?: ContractDurationItem[];
  };
  id?: Id;
  isTaxFixed?: boolean | null;
  minInsuranceSalary?: null | number | string;
  name?: null | string;
  taxPercent?: null | number | string;
}

interface SalaryConfig {
  bHealthInsurance: number;
  bOccAccInsurance: number;
  bSocialInsurance: number;
  bUnemploymentInsurance: number;
  eHealthInsurancePercent: number;
  eIsTaxFixed: boolean;
  eMinTaxSalary: number;
  eSocialInsurancePercent: number;
  eTaxPercent: number;
  eUnemployeeInsurancePercent: number;
  eUnionPercent: number;
}

interface ContractFormModel extends UnknownRecord {
  allowance?: NullableNumber;
  approver?: Id;
  basicSalary?: NullableNumber;
  birthDate?: NullableString;
  businessCalculateOccAccInsuranceFee?: NullableNumber;
  businessHealthInsuranceFee?: NullableNumber;
  businessSocialInsuranceFee?: NullableNumber;
  businessUnemploymentInsuranceFee?: NullableNumber;
  checkers: Id[];
  contractCode?: NullableString;
  contractName?: NullableString;
  contractTypeId?: Id;
  effectiveDate?: NullableNumber;
  email?: NullableString;
  employeeCode?: NullableString;
  employeeHealthInsuranceFee?: NullableNumber;
  employeeId?: Id;
  employeeName?: NullableString;
  employeeSocialInsuranceFee?: NullableNumber;
  employeeUnionFee?: NullableNumber;
  employeeUnemploymentInsuranceFee?: NullableNumber;
  expiryDate?: NullableNumber;
  id?: Id;
  identification?: NullableString;
  insuranceSalary?: NullableNumber;
  insuranceType?: Id;
  insuranceValue?: NullableNumber;
  kpi?: NullableNumber;
  notes?: NullableString;
  phone?: NullableString;
  salaryGross?: NullableNumber;
  salaryNet?: NullableNumber;
  status?: Id;
  tax?: NullableNumber;
  taxFee?: NullableNumber;
  totalCost?: NullableNumber;
}

const props = withDefaults(
  defineProps<{
    contractTypeOptions?: ContractSelectOption[];
    insuranceTypeOptions?: ContractSelectOption[];
    loading?: boolean;
    modelValue?: Partial<ContractFormModel>;
  }>(),
  {
    contractTypeOptions: undefined,
    insuranceTypeOptions: undefined,
    loading: false,
    modelValue: undefined,
  },
);

const emit = defineEmits<{
  cancel: [];
  submit: [value: UnknownRecord];
  'update:modelValue': [value: Partial<ContractFormModel>];
}>();

function createInitialForm(): ContractFormModel {
  return {
    allowance: null,
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
    insuranceType: 1,
    insuranceValue: null,
    kpi: null,
    notes: null,
    phone: null,
    salaryGross: null,
    salaryNet: null,
    status: 1,
    tax: null,
    taxFee: null,
    totalCost: null,
  };
}

const form = reactive<ContractFormModel>(createInitialForm());
const contractTypes = ref<ContractSelectOption[]>([]);
const contractTypeList = ref<ContractTypeItem[]>([]);
const selectedContractType = ref<ContractTypeItem | null>(null);
const selectedDurationValue = ref<null | number>(null);
const statusOptions = ref<ContractSelectOption[]>([]);
const insuranceValueUserEdited = ref(false);

const defaultInsuranceTypes = computed<ContractSelectOption[]>(() => [
  { label: 'Cố định', value: 1 },
  { label: '%', value: 2 },
]);

const insuranceTypes = computed(
  () => props.insuranceTypeOptions ?? defaultInsuranceTypes.value,
);

const durationsOptions = computed<ContractSelectOption[]>(() => {
  if (!form.contractTypeId) {
    return [];
  }

  const contractType = contractTypeList.value.find(
    (item) => String(item.id) === String(form.contractTypeId),
  );
  const durations = getContractDurations(contractType);

  return durations.map((duration) => {
    const value = toNumber(duration.duration, 0);
    return {
      label: duration.name ?? String(duration.duration ?? ''),
      value,
    };
  });
});

const feesTotal = computed(() => {
  return (
    toNumber(form.employeeSocialInsuranceFee, 0) +
    toNumber(form.employeeHealthInsuranceFee, 0) +
    toNumber(form.employeeUnemploymentInsuranceFee, 0) +
    toNumber(form.employeeUnionFee, 0) +
    toNumber(form.taxFee, 0)
  );
});

const title = computed(() => (form.id ? 'Sửa hợp đồng' : 'Tạo hợp đồng'));

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  return fallback;
}

function toTimestamp(value: unknown): NullableNumber {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  return null;
}

function toDateString(value: unknown) {
  const timestamp = toTimestamp(value) ?? Date.now();
  return formatDate(timestamp, 'YYYY-MM-DD');
}

function getRecordValue(record: UnknownRecord, key: string) {
  return record[key];
}

function getStringValue(record: UnknownRecord, key: string) {
  const value = getRecordValue(record, key);
  return typeof value === 'string' ? value : null;
}

function getIdValue(record: UnknownRecord, key: string): Id | undefined {
  const value = getRecordValue(record, key);

  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  return undefined;
}

function getNumberValue(record: UnknownRecord, key: string): NullableNumber {
  const value = getRecordValue(record, key);

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return toNumber(value, 0);
}

function normalizeRecord(
  record?:
    | null
    | Partial<ContractApi.ContractItem>
    | Partial<ContractFormModel>,
) {
  const initialValue = createInitialForm();

  if (!record || !isRecord(record)) {
    return initialValue;
  }

  return {
    ...initialValue,
    ...record,
    allowance: getNumberValue(record, 'allowance'),
    approver: getIdValue(record, 'approver'),
    basicSalary: getNumberValue(record, 'basicSalary'),
    birthDate: getStringValue(record, 'birthDate'),
    checkers: Array.isArray(getRecordValue(record, 'checkers'))
      ? (getRecordValue(record, 'checkers') as Id[])
      : [],
    contractName:
      getStringValue(record, 'contractName') ?? getStringValue(record, 'name'),
    contractTypeId:
      getIdValue(record, 'contractTypeId') ??
      getIdValue(record, 'contractType'),
    effectiveDate: toTimestamp(record.effectiveDate),
    employeeCode: getStringValue(record, 'employeeCode'),
    employeeId: getIdValue(record, 'employeeId'),
    employeeName: getStringValue(record, 'employeeName'),
    expiryDate: toTimestamp(record.expiryDate),
    insuranceType: getIdValue(record, 'insuranceType') ?? 1,
    insuranceValue:
      getNumberValue(record, 'insuranceValue') ??
      getNumberValue(record, 'insurance'),
    kpi: getNumberValue(record, 'kpi'),
    notes: getStringValue(record, 'notes') ?? getStringValue(record, 'note'),
    salaryGross:
      getNumberValue(record, 'salaryGross') ??
      getNumberValue(record, 'totalSalary'),
    status: getIdValue(record, 'status') ?? 1,
    totalCost: getNumberValue(record, 'totalCost'),
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

function mapContractTypeToSalaryConfig(
  contractType: ContractTypeItem | null,
): SalaryConfig {
  return {
    bHealthInsurance:
      toNumber(contractType?.businessHealthInsurancePercent, 0) / 100,
    bOccAccInsurance:
      toNumber(contractType?.businessOccAccInsurancePercent, 0) / 100,
    bSocialInsurance:
      toNumber(contractType?.businessSocialInsurancePercent, 0) / 100,
    bUnemploymentInsurance:
      toNumber(contractType?.businessUnemploymentInsurancePercent, 0) / 100,
    eHealthInsurancePercent:
      toNumber(contractType?.employeeHealthInsurancePercent, 0) / 100,
    eIsTaxFixed: Boolean(contractType?.isTaxFixed),
    eMinTaxSalary: toNumber(contractType?.employeeMinTaxSalary, 0),
    eSocialInsurancePercent:
      toNumber(contractType?.employeeSocialInsurancePercent, 0) / 100,
    eTaxPercent: toNumber(contractType?.taxPercent, 0) / 100,
    eUnemployeeInsurancePercent:
      toNumber(contractType?.employeeUnemployeeInsurancePercent, 0) / 100,
    eUnionPercent: toNumber(contractType?.employeeUnionPercent, 0) / 100,
  };
}

function calculateInsuranceFee(insuranceSalary: number, percent: number) {
  return Number((insuranceSalary * percent).toFixed(2));
}

function calculateTaxFee(
  gross: number,
  taxValue: number,
  config: SalaryConfig,
) {
  if (config.eIsTaxFixed) {
    return Number(taxValue.toFixed(2));
  }

  const taxableSalary = Math.max(gross - config.eMinTaxSalary, 0);
  const percent =
    taxValue > 1 ? taxValue / 100 : taxValue || config.eTaxPercent;
  return Number((taxableSalary * percent).toFixed(2));
}

function extractList(response: unknown): UnknownRecord[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }

  if (!isRecord(response)) {
    return [];
  }

  const data = response.data;
  const items = response.items;

  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (Array.isArray(items)) {
    return items.filter(isRecord);
  }

  return [];
}

function getContractTypeFromResponse(
  response: unknown,
): ContractTypeItem | null {
  if (!isRecord(response)) {
    return null;
  }

  if (isRecord(response.data)) {
    return response.data as ContractTypeItem;
  }

  return response as ContractTypeItem;
}

function upsertContractType(contractType: ContractTypeItem) {
  if (contractType.id === undefined) {
    return;
  }

  const index = contractTypeList.value.findIndex(
    (item) => String(item.id) === String(contractType.id),
  );

  if (index >= 0) {
    contractTypeList.value[index] = contractType;
    return;
  }

  contractTypeList.value.push(contractType);
}

function syncSelectedDurationFromContractName() {
  if (!form.contractName) {
    selectedDurationValue.value = null;
    return;
  }

  const contractName = String(form.contractName).trim();
  const durations = getContractDurations(selectedContractType.value);
  const matchedDuration = durations.find((duration) => {
    const durationName = String(duration.name ?? '').trim();
    return (
      durationName === contractName ||
      String(duration.duration ?? '') === contractName
    );
  });

  selectedDurationValue.value = matchedDuration
    ? toNumber(matchedDuration.duration, 0)
    : null;
}

function mapToOptions(list: UnknownRecord[]): ContractSelectOption[] {
  const options: ContractSelectOption[] = [];

  for (const item of list) {
    const value = getIdValue(item, 'id');

    if (value === undefined) {
      continue;
    }

    options.push({
      label: getStringValue(item, 'name') ?? String(value),
      value,
    });
  }

  return options;
}

async function loadContractTypes() {
  try {
    const response = await getContractTypeListApi({
      page: 1,
      pageSize: 1000,
    });
    const list = extractList(response);
    const apiOptions = mapToOptions(list);

    contractTypeList.value = list as ContractTypeItem[];
    contractTypes.value = apiOptions.length
      ? apiOptions
      : (props.contractTypeOptions ?? []);

    if (form.contractTypeId) {
      await loadSelectedContractType(form.contractTypeId);
      syncSelectedDurationFromContractName();
    }
  } catch {
    contractTypeList.value = [];
    contractTypes.value = props.contractTypeOptions ?? [];
  }
}

async function loadSelectedContractType(contractTypeId?: Id) {
  if (!contractTypeId) {
    selectedContractType.value = null;
    return;
  }

  syncSelectedContractType();

  try {
    const response = await getContractTypeByIdApi(contractTypeId);
    const contractType = getContractTypeFromResponse(response);

    if (!contractType) {
      return;
    }

    upsertContractType(contractType);
    selectedContractType.value = contractType;
  } catch {
    // Keep the selected contract type from the loaded list if detail API fails.
  }
}

async function loadStatuses() {
  try {
    const response = await requestClient.get<unknown>(
      '/api/hrms/contract/status',
      {
        responseReturn: 'body',
      },
    );
    statusOptions.value = mapToOptions(extractList(response));
  } catch {
    statusOptions.value = [];
  }
}

function numberFormatter(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function numberParser(value: string) {
  return value ? value.replaceAll(',', '') : value;
}

function markInsuranceValueEdited() {
  insuranceValueUserEdited.value = true;
}

function syncSelectedContractType() {
  selectedContractType.value =
    contractTypeList.value.find(
      (item) => String(item.id) === String(form.contractTypeId),
    ) ?? null;
}

async function onContractTypeChange(value: Id | null) {
  form.contractTypeId = value ?? undefined;
  form.contractName = null;
  selectedDurationValue.value = null;
  await loadSelectedContractType(form.contractTypeId);
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
    form.employeeName = getStringValue(selectedOption, 'name') ?? '';
    form.employeeCode = getStringValue(selectedOption, 'userName') ?? '';
    form.email = getStringValue(selectedOption, 'email') ?? '';
    form.phone = getStringValue(selectedOption, 'phone') ?? '';
    form.identification =
      getStringValue(selectedOption, 'identification') ?? '';
    form.birthDate = getStringValue(selectedOption, 'birthDate');
    form.tax = getNumberValue(selectedOption, 'taxCode');
  }
}

function onDurationChange(value: null | number) {
  selectedDurationValue.value = value;

  if (value === null) {
    form.contractName = null;
    return;
  }

  const durations = getContractDurations(selectedContractType.value);
  const duration = durations.find(
    (item) => toNumber(item.duration, 0) === Number(value),
  );

  form.contractName = duration?.name ?? String(value);
  applyDuration(value);
}

function applyDuration(months: number) {
  const now = Date.now();
  form.effectiveDate = now;

  if (months === 0) {
    form.expiryDate = null;
    message.success('Đã đặt hiệu lực hôm nay, vô thời hạn');
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
    businessCalculateOccAccInsuranceFee:
      form.businessCalculateOccAccInsuranceFee ?? 0,
    businessHealthInsuranceFee: form.businessHealthInsuranceFee ?? 0,
    businessSocialInsuranceFee: form.businessSocialInsuranceFee ?? 0,
    businessUnemploymentInsuranceFee:
      form.businessUnemploymentInsuranceFee ?? 0,
    checkers: form.checkers,
    contractName: form.contractName,
    contractTypeId: form.contractTypeId,
    effectiveDate: toDateString(form.effectiveDate),
    employeeId: form.employeeId,
    employeeUnionFee: form.employeeUnionFee ?? 0,
    expiryDate: form.expiryDate ? toDateString(form.expiryDate) : null,
    insurance: form.insuranceValue ?? 0,
    insuranceSalary: form.insuranceSalary ?? 0,
    insuranceType: form.insuranceType,
    kpi: form.kpi ?? 0,
    note: form.notes ?? '',
    salaryNet: form.salaryNet ?? 0,
    status: form.status,
    tax: form.tax ?? 0,
    taxFee: form.taxFee ?? 0,
    totalCost: form.totalCost ?? 0,
    totalSalary: form.salaryGross ?? 0,
  };

  emit('submit', payload);
  emit('update:modelValue', { ...form });
}

function resetFormWithRecord(
  record?: null | Partial<ContractApi.ContractItem>,
) {
  Object.assign(form, normalizeRecord(record));
  syncSelectedContractType();
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    emit('cancel');
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{
        contractTypes?: ContractSelectOption[];
        record: null | Partial<ContractApi.ContractItem>;
        statusOptions?: ContractSelectOption[];
      }>();

      if (data.contractTypes?.length) {
        contractTypes.value = data.contractTypes;
      }

      if (data.statusOptions?.length) {
        statusOptions.value = data.statusOptions;
      }

      resetFormWithRecord(data.record);
      void loadContractTypes();
      return;
    }

    Object.assign(form, createInitialForm());
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      Object.assign(form, normalizeRecord(value));
      syncSelectedContractType();
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
  () => form.contractTypeId,
  async (value) => {
    await loadSelectedContractType(value);
    syncSelectedDurationFromContractName();
  },
);

watch(
  () => [
    form.basicSalary,
    form.kpi,
    form.allowance,
    form.insuranceValue,
    form.taxFee,
    form.employeeUnionFee,
  ],
  () => {
    const basic = toNumber(form.basicSalary, 0);
    const kpi = toNumber(form.kpi, 0);
    const allowance = toNumber(form.allowance, 0);
    const gross = Number((basic + kpi + allowance).toFixed(2));
    const deductions =
      toNumber(form.insuranceValue, 0) +
      toNumber(form.taxFee, 0) +
      toNumber(form.employeeUnionFee, 0);

    form.salaryGross = gross;
    form.salaryNet = Number((gross - deductions).toFixed(2));
  },
);

watch(
  () => [form.insuranceType, form.insuranceValue, form.salaryGross],
  () => {
    const type = Number(form.insuranceType);
    const value = toNumber(form.insuranceValue, 0);
    const gross = toNumber(form.salaryGross, 0);

    if (type === 1) {
      form.insuranceSalary = Number(value.toFixed(2));
    } else if (type === 2) {
      form.insuranceSalary = Number((gross * (value / 100)).toFixed(2));
    } else {
      form.insuranceSalary = null;
    }
  },
  { immediate: true },
);

watch(
  () => [
    form.insuranceSalary,
    form.contractTypeId,
    form.tax,
    selectedContractType.value,
  ],
  () => {
    const insuranceSalary = toNumber(form.insuranceSalary, 0);
    const gross = toNumber(form.salaryGross, 0);
    const taxPercent = toNumber(form.tax, 0);
    const config = mapContractTypeToSalaryConfig(selectedContractType.value);

    form.employeeSocialInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.eSocialInsurancePercent,
    );
    form.employeeHealthInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.eHealthInsurancePercent,
    );
    form.employeeUnemploymentInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.eUnemployeeInsurancePercent,
    );
    form.employeeUnionFee = calculateInsuranceFee(
      insuranceSalary,
      config.eUnionPercent,
    );
    form.businessSocialInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.bSocialInsurance,
    );
    form.businessHealthInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.bHealthInsurance,
    );
    form.businessUnemploymentInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.bUnemploymentInsurance,
    );
    form.businessCalculateOccAccInsuranceFee = calculateInsuranceFee(
      insuranceSalary,
      config.bOccAccInsurance,
    );
    form.taxFee = calculateTaxFee(gross, taxPercent, config);
  },
  { immediate: true },
);

watch(
  () => [
    form.salaryGross,
    form.businessSocialInsuranceFee,
    form.businessCalculateOccAccInsuranceFee,
    form.businessHealthInsuranceFee,
    form.businessUnemploymentInsuranceFee,
  ],
  () => {
    const businessFeeTotal =
      toNumber(form.businessSocialInsuranceFee, 0) +
      toNumber(form.businessCalculateOccAccInsuranceFee, 0) +
      toNumber(form.businessHealthInsuranceFee, 0) +
      toNumber(form.businessUnemploymentInsuranceFee, 0);

    form.totalCost = Number(
      (toNumber(form.salaryGross, 0) + businessFeeTotal).toFixed(2),
    );
  },
);

watch(
  () => form.basicSalary,
  (value) => {
    const currentInsuranceValue = toNumber(form.insuranceValue, 0);

    if (
      Number(form.insuranceType) === 1 &&
      !insuranceValueUserEdited.value &&
      currentInsuranceValue === 0
    ) {
      form.insuranceValue = Number(toNumber(value, 0).toFixed(2));
    }
  },
);

watch(
  () => form.insuranceType,
  () => {
    insuranceValueUserEdited.value = false;

    if (
      Number(form.insuranceType) === 1 &&
      toNumber(form.insuranceValue, 0) === 0
    ) {
      form.insuranceValue = Number(toNumber(form.basicSalary, 0).toFixed(2));
    }
  },
);

void loadContractTypes();
void loadStatuses();
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
        @update:form="(value) => Object.assign(form, value)"
      />

      <ContractEmployeeCosts
        :fees-total="feesTotal"
        :form="form"
        :insurance-types="insuranceTypes"
        :number-formatter="numberFormatter"
        :number-parser="numberParser"
        @insurance-value-change="markInsuranceValueEdited"
        @update:form="(value) => Object.assign(form, value)"
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
