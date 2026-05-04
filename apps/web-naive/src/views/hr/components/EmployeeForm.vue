<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from "naive-ui";

import type { EmployeeApi } from "#/api";

import { computed, nextTick, reactive, ref, watch } from "vue";

import { useVbenDrawer } from "@vben/common-ui";

import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NSelect,
  NSpace,
} from "naive-ui";

import { message } from "#/adapter/naive";
import { createEmployeeApi, updateEmployeeApi } from "#/api";
import UserSearchSelect from "#/components/UserSearchSelect.vue";

type NullableString = null | string;
type EmployeeFormValue = null | number | string | undefined;
type UserRecord = Record<string, unknown>;

interface EmployeeFormData {
  address?: NullableString;
  birthDate?: null | number;
  concurrencyStamp?: NullableString;
  department?: NullableString;
  email?: NullableString;
  employeeCode?: NullableString;
  enrollDate?: null | number;
  gender?: null | number;
  id?: number | string;
  name: string;
  phone: string;
  position?: NullableString;
  resignationDate?: null | number;
  status?: NullableString;
  userId?: NullableString;
  userName?: NullableString;
}

const emit = defineEmits<{
  submit: [data: EmployeeApi.EmployeeMutationPayload];
  "update:open": [value: boolean];
}>();

const formRef = ref<FormInst | null>(null);

function resetForm(): EmployeeFormData {
  return {
    address: null,
    birthDate: null,
    concurrencyStamp: null,
    department: null,
    email: null,
    employeeCode: null,
    enrollDate: null,
    gender: null,
    id: undefined,
    name: "",
    phone: "",
    position: null,
    resignationDate: null,
    status: null,
    userId: null,
    userName: null,
  };
}

const formData = reactive<EmployeeFormData>(resetForm());

const genderOptions: SelectOption[] = [
  { label: "Nam", value: 1 },
  { label: "Nữ", value: 2 },
  { label: "Khác", value: 0 },
];

const departmentOptions: SelectOption[] = [
  { label: "Nhân sự", value: "Nhân sự" },
  { label: "Kế toán", value: "Kế toán" },
  { label: "IT", value: "IT" },
  { label: "Marketing", value: "Marketing" },
  { label: "Kinh doanh", value: "Kinh doanh" },
];

const statusOptions: SelectOption[] = [
  { label: "Đang làm", value: "Đang làm" },
  { label: "Nghỉ việc", value: "Nghỉ việc" },
  { label: "Nghỉ phép năm", value: "Nghỉ phép năm" },
  { label: "Nghỉ ốm", value: "Nghỉ ốm" },
];

const formRules: FormRules = {
  name: [
    {
      message: "Vui lòng nhập họ tên",
      required: true,
      trigger: ["blur", "input"],
    },
  ],
  phone: [
    {
      message: "Vui lòng nhập số điện thoại",
      required: true,
      trigger: ["blur", "input"],
    },
  ],
};

function toTimestamp(value: EmployeeFormValue): null | number {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function toApiDate(value?: null | number) {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizeText(value?: NullableString) {
  return value?.trim() || null;
}

function normalizeRecord(record?: null | Partial<EmployeeApi.EmployeeItem>): EmployeeFormData {
  const initialValue = resetForm();

  if (!record) {
    return initialValue;
  }

  return {
    ...initialValue,
    address: record.address ?? null,
    birthDate: toTimestamp(record.birthDate),
    concurrencyStamp: record.concurrencyStamp ?? null,
    department: record.department ?? null,
    email: record.email ?? null,
    employeeCode: record.employeeCode ?? null,
    enrollDate: toTimestamp(record.enrollDate),
    gender: record.gender ?? null,
    id: record.id,
    name: record.name ?? "",
    phone: record.phone ?? "",
    position: record.position ?? null,
    resignationDate: toTimestamp(record.resignationDate),
    status: record.status ?? null,
    userId: record.userId ?? null,
    userName: record.userName ?? null,
  };
}

function buildPayload(): EmployeeApi.EmployeeMutationPayload {
  return {
    address: normalizeText(formData.address),
    birthDate: toApiDate(formData.birthDate),
    concurrencyStamp: normalizeText(formData.concurrencyStamp),
    department: normalizeText(formData.department),
    email: normalizeText(formData.email),
    employeeCode: normalizeText(formData.employeeCode),
    enrollDate: toApiDate(formData.enrollDate),
    gender: formData.gender ?? null,
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    position: normalizeText(formData.position),
    resignationDate: toApiDate(formData.resignationDate),
    status: normalizeText(formData.status),
    userId: normalizeText(formData.userId),
    userName: normalizeText(formData.userName),
  };
}

function getUserText(user: UserRecord, key: string) {
  const value = user[key];
  return typeof value === "string" ? value : "";
}

function onUserSelected(user: UserRecord) {
  formData.userName = getUserText(user, "userName") || null;
  formData.email = getUserText(user, "email") || null;
  formData.phone = getUserText(user, "phoneNumber") || getUserText(user, "phone") || "";
}

watch(
  () => formData.userId,
  (userId) => {
    if (!userId) {
      formData.userName = null;
      formData.email = null;
      formData.phone = "";
    }
  },
);

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const payload = buildPayload();

    await (formData.id ? updateEmployeeApi(formData.id, payload) : createEmployeeApi(payload));

    message.success("Thao tác thành công");
    emit("submit", payload);
    drawerApi.close();
  } catch {
    message.error("Vui lòng kiểm tra lại thông tin");
  }
}

function handleReset() {
  const data = drawerApi.getData<{
    record: null | Partial<EmployeeApi.EmployeeItem>;
  }>();
  Object.assign(formData, normalizeRecord(data.record));
  void nextTick(() => formRef.value?.restoreValidation());
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<{
        record: null | Partial<EmployeeApi.EmployeeItem>;
      }>();
      Object.assign(formData, normalizeRecord(data.record));
      void nextTick(() => formRef.value?.restoreValidation());
      return;
    }

    Object.assign(formData, resetForm());
    emit("update:open", false);
  },
});

const title = computed(() => (formData.id ? "Sửa nhân viên" : "Thêm nhân viên"));

defineExpose({
  drawerApi,
});
</script>

<template>
  <Drawer :title="title" class="md:w-[1000px]">
    <NForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <NGrid :cols="2" :x-gap="16">
        <NFormItemGi label="Họ và tên" path="name">
          <NInput v-model:value="formData.name" placeholder="Nhập họ và tên" />
        </NFormItemGi>

        <NFormItemGi label="User" path="userId">
          <UserSearchSelect
            v-model="formData.userId"
            placeholder="Chọn người dùng"
            @user-selected="onUserSelected"
          />
        </NFormItemGi>

        <NFormItemGi label="Tên người dùng" path="userName">
          <NInput v-model:value="formData.userName" placeholder="Tên người dùng" readonly />
        </NFormItemGi>

        <NFormItemGi label="Mã nhân viên" path="employeeCode">
          <NInput v-model:value="formData.employeeCode" placeholder="Mã nhân viên" readonly />
        </NFormItemGi>

        <NFormItemGi label="Số điện thoại" path="phone">
          <NInput v-model:value="formData.phone" placeholder="Nhập số điện thoại" />
        </NFormItemGi>

        <NFormItemGi label="Email" path="email">
          <NInput v-model:value="formData.email" placeholder="Email" readonly />
        </NFormItemGi>

        <NFormItemGi label="Ngày sinh" path="birthDate">
          <NDatePicker
            v-model:value="formData.birthDate"
            clearable
            format="dd/MM/yyyy"
            placeholder="Chọn ngày sinh"
            style="width: 100%"
            type="date"
          />
        </NFormItemGi>

        <NFormItemGi label="Giới tính" path="gender">
          <NSelect
            v-model:value="formData.gender"
            clearable
            :options="genderOptions"
            placeholder="Chọn giới tính"
          />
        </NFormItemGi>

        <NFormItemGi label="Vị trí" path="position">
          <NInput v-model:value="formData.position" placeholder="Nhập vị trí" />
        </NFormItemGi>

        <NFormItemGi label="Phòng ban" path="department">
          <NSelect
            v-model:value="formData.department"
            clearable
            :options="departmentOptions"
            placeholder="Chọn phòng ban"
          />
        </NFormItemGi>
      </NGrid>

      <NFormItem label="Địa chỉ" path="address">
        <NInput
          v-model:value="formData.address"
          placeholder="Nhập địa chỉ"
          :rows="3"
          type="textarea"
        />
      </NFormItem>

      <NGrid :cols="2" :x-gap="16">
        <NFormItemGi label="Ngày vào làm" path="enrollDate">
          <NDatePicker
            v-model:value="formData.enrollDate"
            clearable
            format="dd/MM/yyyy"
            placeholder="Chọn ngày vào làm"
            style="width: 100%"
            type="date"
          />
        </NFormItemGi>

        <NFormItemGi label="Ngày nghỉ việc" path="resignationDate">
          <NDatePicker
            v-model:value="formData.resignationDate"
            clearable
            format="dd/MM/yyyy"
            placeholder="Chọn ngày nghỉ việc"
            style="width: 100%"
            type="date"
          />
        </NFormItemGi>
      </NGrid>

      <NFormItem label="Trạng thái" path="status">
        <NSelect
          v-model:value="formData.status"
          clearable
          :options="statusOptions"
          placeholder="Chọn trạng thái"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="drawerApi.close()">Hủy</NButton>
        <NButton @click="handleReset">Đặt lại</NButton>
        <NButton type="primary" @click="handleSubmit">Lưu</NButton>
      </NSpace>
    </template>
  </Drawer>
</template>

<style scoped>
:deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
