<script lang="ts" setup>
import type { FormInst, FormRules } from "naive-ui";

import type { UnknownRecord } from "#/models/hr/contract";
import type {
  ContractDurationFormItem,
  ContractTypeApi,
  ContractTypeFormModel,
} from "#/models/hr/contract-type";

import { computed, nextTick, reactive, ref } from "vue";

import { useVbenDrawer } from "@vben/common-ui";

import { NButton, NDivider, NForm, NFormItem, NInput, NInputNumber, NSwitch } from "naive-ui";

const emit = defineEmits<{
  cancel: [];
  submit: [payload: UnknownRecord];
}>();

const formRef = ref<FormInst | null>(null);

function resetForm(): ContractTypeFormModel {
  return {
    businessHealthInsurancePercent: 3,
    businessOccAccInsurancePercent: 0.5,
    businessSocialInsurancePercent: 17.5,
    businessUnemploymentInsurancePercent: 1,
    code: "",
    contractDurations: [],
    employeeHealthInsurancePercent: 1.5,
    employeeMinTaxSalary: 0,
    employeeSocialInsurancePercent: 8,
    employeeUnionPercent: 1,
    employeeUnemployeeInsurancePercent: 1,
    extraProperties: {},
    hasSocialInsurance: true,
    id: undefined,
    isTaxFixed: false,
    minInsuranceSalary: 0,
    name: "",
    taxPercent: 0,
  };
}

const model = reactive<ContractTypeFormModel>(resetForm());

const formRules: FormRules = {
  name: [
    {
      message: "Vui lòng nhập tên loại hợp đồng",
      required: true,
      trigger: ["blur", "input"],
    },
  ],
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? fallback : numericValue;
  }

  return fallback;
}

function numberFormatter(value: null | number) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberParser(value: string) {
  const numericValue = Number(value.replaceAll(",", ""));
  return Number.isNaN(numericValue) ? null : numericValue;
}

function normalizeDuration(
  duration: ContractDurationFormItem | ContractTypeApi.DurationItem,
): ContractDurationFormItem {
  return {
    duration: toNumber(duration.duration, 1),
    id: typeof duration.id === "number" ? duration.id : null,
    name: duration.name ?? "",
  };
}

function normalizeRecord(record?: ContractTypeApi.ContractTypeItem | null) {
  const initialValue = resetForm();

  if (!record) {
    return initialValue;
  }

  const rawExtraProperties = (record as unknown as UnknownRecord).extraProperties;
  const extraProperties =
    typeof rawExtraProperties === "object" && rawExtraProperties !== null
      ? (rawExtraProperties as UnknownRecord)
      : {};
  const extraDurations = Array.isArray(extraProperties.durations) ? extraProperties.durations : [];
  const durations = record.durations?.length ? record.durations : extraDurations;

  return {
    ...initialValue,
    ...record,
    businessHealthInsurancePercent: toNumber(
      record.businessHealthInsurancePercent,
      initialValue.businessHealthInsurancePercent ?? 0,
    ),
    businessOccAccInsurancePercent: toNumber(
      record.businessOccAccInsurancePercent,
      initialValue.businessOccAccInsurancePercent ?? 0,
    ),
    businessSocialInsurancePercent: toNumber(
      record.businessSocialInsurancePercent,
      initialValue.businessSocialInsurancePercent ?? 0,
    ),
    businessUnemploymentInsurancePercent: toNumber(
      record.businessUnemploymentInsurancePercent,
      initialValue.businessUnemploymentInsurancePercent ?? 0,
    ),
    code: record.code ?? "",
    contractDurations: durations.map((duration) =>
      normalizeDuration(duration as ContractTypeApi.DurationItem),
    ),
    employeeHealthInsurancePercent: toNumber(
      record.employeeHealthInsurancePercent,
      initialValue.employeeHealthInsurancePercent ?? 0,
    ),
    employeeMinTaxSalary: toNumber(
      record.employeeMinTaxSalary,
      initialValue.employeeMinTaxSalary ?? 0,
    ),
    employeeSocialInsurancePercent: toNumber(
      record.employeeSocialInsurancePercent,
      initialValue.employeeSocialInsurancePercent ?? 0,
    ),
    employeeUnionPercent: toNumber(
      record.employeeUnionPercent,
      initialValue.employeeUnionPercent ?? 0,
    ),
    employeeUnemployeeInsurancePercent: toNumber(
      record.employeeUnemployeeInsurancePercent,
      initialValue.employeeUnemployeeInsurancePercent ?? 0,
    ),
    extraProperties,
    hasSocialInsurance: record.hasSocialInsurance ?? initialValue.hasSocialInsurance,
    id: record.id,
    isTaxFixed: record.isTaxFixed ?? initialValue.isTaxFixed,
    minInsuranceSalary: toNumber(record.minInsuranceSalary, initialValue.minInsuranceSalary ?? 0),
    name: record.name ?? "",
    taxPercent: toNumber(record.taxPercent, initialValue.taxPercent ?? 0),
  } satisfies ContractTypeFormModel;
}

function addDuration() {
  model.contractDurations.push({ duration: 1, id: null, name: "" });
}

function removeDuration(index: number) {
  model.contractDurations.splice(index, 1);
}

async function handleSubmit() {
  await formRef.value?.validate();

  const durations = model.contractDurations.map((duration) => ({
    duration: Number(duration.duration),
    name: duration.name,
  }));

  emit("submit", {
    ...model,
    extraProperties: {
      ...model.extraProperties,
      durations,
    },
  });
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
        record?: ContractTypeApi.ContractTypeItem | null;
      }>();
      Object.assign(model, normalizeRecord(data.record));
      void nextTick(() => formRef.value?.restoreValidation());
      return;
    }

    Object.assign(model, resetForm());
  },
});

const title = computed(() => (model.id ? "Sửa loại hợp đồng" : "Thêm loại hợp đồng"));
</script>

<template>
  <Drawer :title="title" class="md:w-[1100px]">
    <NForm
      ref="formRef"
      class="mx-auto w-full max-w-[1100px] p-4 pb-20"
      label-placement="top"
      :model="model"
      :rules="formRules"
    >
      <NFormItem label="Tên loại hợp đồng" path="name">
        <NInput v-model:value="model.name" placeholder="Nhập tên loại hợp đồng" />
      </NFormItem>

      <NFormItem label="Mã loại hợp đồng" path="code">
        <NInput v-model:value="model.code" placeholder="Nhập mã loại hợp đồng" />
      </NFormItem>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NFormItem label="Thuế cố định" path="isTaxFixed">
          <NSwitch v-model:value="model.isTaxFixed" />
        </NFormItem>

        <NFormItem label="Thuế (%)" path="taxPercent">
          <NInputNumber
            v-model:value="model.taxPercent"
            :disabled="!model.isTaxFixed"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>
      </div>

      <NDivider title-placement="left">Chi phí nhân viên</NDivider>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NFormItem label="Đóng BHXH" path="hasSocialInsurance">
          <NSwitch v-model:value="model.hasSocialInsurance" />
        </NFormItem>

        <NFormItem label="BHXH nhân viên (%)" path="employeeSocialInsurancePercent">
          <NInputNumber
            v-model:value="model.employeeSocialInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="BHYT nhân viên (%)" path="employeeHealthInsurancePercent">
          <NInputNumber
            v-model:value="model.employeeHealthInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="BHTN nhân viên (%)" path="employeeUnemployeeInsurancePercent">
          <NInputNumber
            v-model:value="model.employeeUnemployeeInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="Phí công đoàn nhân viên (%)" path="employeeUnionPercent">
          <NInputNumber
            v-model:value="model.employeeUnionPercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="Lương tính thuế tối thiểu" path="employeeMinTaxSalary">
          <NInputNumber
            v-model:value="model.employeeMinTaxSalary"
            :disabled="!model.hasSocialInsurance"
            :format="numberFormatter"
            :min="0"
            :parse="numberParser"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>
      </div>

      <NDivider title-placement="left">Chi phí doanh nghiệp</NDivider>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NFormItem label="BHXH doanh nghiệp (%)" path="businessSocialInsurancePercent">
          <NInputNumber
            v-model:value="model.businessSocialInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="BHYT doanh nghiệp (%)" path="businessHealthInsurancePercent">
          <NInputNumber
            v-model:value="model.businessHealthInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="BHTN doanh nghiệp (%)" path="businessUnemploymentInsurancePercent">
          <NInputNumber
            v-model:value="model.businessUnemploymentInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="BHTNLĐ-BNN doanh nghiệp (%)" path="businessOccAccInsurancePercent">
          <NInputNumber
            v-model:value="model.businessOccAccInsurancePercent"
            :disabled="!model.hasSocialInsurance"
            :min="0"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>

        <NFormItem label="Lương đóng BH tối thiểu" path="minInsuranceSalary">
          <NInputNumber
            v-model:value="model.minInsuranceSalary"
            :disabled="!model.hasSocialInsurance"
            :format="numberFormatter"
            :min="0"
            :parse="numberParser"
            :show-button="false"
            style="width: 100%"
          />
        </NFormItem>
      </div>

      <NDivider title-placement="left">Thời hạn hợp đồng</NDivider>
      <NFormItem>
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="(duration, index) in model.contractDurations"
            :key="duration.id ?? index"
            class="flex items-center gap-2"
          >
            <NInput v-model:value="duration.name" class="flex-[3]" placeholder="Tên thời hạn" />
            <NInputNumber
              v-model:value="duration.duration"
              :min="1"
              :show-button="false"
              style="width: 80px"
            />
            <NButton text type="error" @click="() => removeDuration(index)"> Xóa </NButton>
          </div>

          <NButton dashed type="primary" @click="addDuration"> Thêm thời hạn </NButton>
        </div>
      </NFormItem>
    </NForm>
  </Drawer>
</template>
