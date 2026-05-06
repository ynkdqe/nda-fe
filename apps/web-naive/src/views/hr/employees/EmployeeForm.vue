<script lang="ts" setup>
import type { FormInst, FormRules, SelectOption } from 'naive-ui';

import type { EmployeeApi } from '#/api';
import type {
  EmployeeBankFormItem,
  EmployeeFormData,
} from '#/models/hr/employee/employee';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

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
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  createEmployeeApi,
  employeeGenderOptions,
  employeeMaritalStatusOptions,
  EmployeeStatus,
  employeeStatusOptions,
  getEmployeeBankOptionsApi,
  getEmployeeDepartmentOptionsApi,
  getEmployeePositionOptionsApi,
  updateEmployeeApi,
} from '#/api';
import UserSearchSelect from '#/components/UserSearchSelect.vue';
import { toTimestamp } from '#/utils/date';
import {
  normalizeNumberValue,
  normalizeSelectValue,
  normalizeText,
  type NullableSelectValue,
} from '#/utils/normalize';

type UserRecord = Record<string, unknown>;

const emit = defineEmits<{
  submit: [data: EmployeeApi.EmployeeMutationPayload];
  'update:open': [value: boolean];
}>();

const formRef = ref<FormInst | null>(null);
let bankItemSeed = 0;

function getTodayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function createBankItem(
  item?: Partial<EmployeeApi.EmployeeBankItem>,
): EmployeeBankFormItem {
  const bankItem = item as
    | (Partial<EmployeeApi.EmployeeBankItem> & {
        accountNumber?: null | string;
        bank?: NullableSelectValue;
      })
    | undefined;

  return {
    accountName: bankItem?.accountName ?? '',
    accountNo: bankItem?.accountNo ?? bankItem?.accountNumber ?? '',
    bankId: bankItem?.bankId ?? bankItem?.bank ?? null,
    key: ++bankItemSeed,
  };
}

function resetForm(): EmployeeFormData {
  return {
    address: null,
    banks: [],
    birthDate: null,
    concurrencyStamp: null,
    department: null,
    email: null,
    employeeCode: null,
    enrollDate: getTodayTimestamp(),
    gender: null,
    id: undefined,
    identification: null,
    maritalStatus: null,
    name: '',
    national: null,
    phone: '',
    position: null,
    resignationDate: null,
    status: EmployeeStatus.Working,
    taxCode: null,
    userId: null,
    userName: null,
  };
}

const formData = reactive<EmployeeFormData>(resetForm());
const selectedUser = ref<null | UserRecord>(null);
const isEditMode = computed(() => !!formData.id);

const departmentOptions = ref<SelectOption[]>([]);
const departmentLoading = ref(false);
const positionOptions = ref<SelectOption[]>([]);
const positionLoading = ref(false);
const bankOptions = ref<SelectOption[]>([]);
const bankLoading = ref(false);
const bankOptionsLoaded = ref(false);

const nationalOptions: SelectOption[] = [
  { label: 'Việt Nam', value: 'Việt Nam' },
  { label: 'Trung Quốc', value: 'Trung Quốc' },
  { label: 'Mỹ', value: 'Mỹ' },
  { label: 'Nhật Bản', value: 'Nhật Bản' },
  { label: 'Hàn Quốc', value: 'Hàn Quốc' },
  { label: 'Khác', value: 'Khác' },
];

const formRules: FormRules = {
  name: [
    {
      message: 'Vui lòng nhập họ tên',
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
  phone: [
    {
      message: 'Vui lòng nhập số điện thoại',
      required: true,
      trigger: ['blur', 'input'],
    },
  ],
};

function toApiDate(value?: null | number) {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizeBankItems(
  value?: EmployeeApi.EmployeeBankItem[] | null | string,
): EmployeeBankFormItem[] {
  if (Array.isArray(value)) {
    return value.map((item) => createBankItem(item));
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter(isObjectRecord)
        .map((item) => createBankItem(item as EmployeeApi.EmployeeBankItem));
    }
  } catch {
    // Keep old free-text bank data out of the structured list.
  }

  return [];
}

function normalizeBankPayload() {
  const banks = formData.banks
    .map((item) => ({
      accountName: normalizeText(item.accountName),
      accountNo: normalizeText(item.accountNo),
      bankId: normalizeNumberValue(item.bankId),
    }))
    .filter((item) => item.accountName || item.accountNo || item.bankId);

  return banks.length > 0 ? banks : null;
}

function normalizeOptionResponse(
  response: EmployeeApi.EmployeeOptionResult,
): SelectOption[] {
  let items: EmployeeApi.EmployeeOptionItem[] = [];

  if (Array.isArray(response)) {
    items = response;
  } else if (Array.isArray(response.data)) {
    items = response.data;
  } else if (Array.isArray(response.items)) {
    items = response.items;
  }

  return items
    .map((item) => {
      const value =
        item.value ?? item.code ?? item.shortName ?? item.name ?? item.id;
      const label = item.shortName
        ? `${item.shortName}${item.name ? ` - ${item.name}` : ''}`
        : (item.name ?? item.displayName ?? item.code ?? item.value ?? item.id);

      if (value === null || value === undefined || value === '') {
        return null;
      }

      return {
        label: String(label ?? value),
        value,
      };
    })
    .filter(Boolean) as SelectOption[];
}

function normalizeBankOptionResponse(
  response: EmployeeApi.BankListResult,
): SelectOption[] {
  return response.data
    .map((bank) => {
      const value = bank.id;
      const shortName = bank.shortName ?? bank.short_name ?? bank.code;
      const label = shortName
        ? `${shortName}${bank.name ? ` - ${bank.name}` : ''}`
        : (bank.name ?? bank.code ?? bank.id);

      if (value === null || value === undefined || value === '') {
        return null;
      }

      return {
        label: String(label ?? value),
        value,
      };
    })
    .filter(Boolean) as SelectOption[];
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getRoleValue(role: Record<string, unknown> | string) {
  if (typeof role === 'string') {
    return role.trim() || null;
  }

  const value =
    role.value ??
    role.Value ??
    role.id ??
    role.Id ??
    role.name ??
    role.Name ??
    role.label ??
    role.Label;

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function getRoleLabel(
  role: Record<string, unknown> | string,
  value: number | string,
) {
  if (typeof role === 'string') {
    return role;
  }

  const label =
    role.label ??
    role.Label ??
    role.name ??
    role.Name ??
    role.displayName ??
    role.DisplayName ??
    role.value ??
    role.Value ??
    value;

  return String(label);
}

function normalizeRoleOption(role?: null | Record<string, unknown> | string) {
  if (!role) {
    return null;
  }

  const value = getRoleValue(role);

  if (value === null) {
    return null;
  }

  return {
    label: getRoleLabel(role, value),
    value,
  } satisfies SelectOption;
}

function getRecordRole(record?: null | Partial<EmployeeApi.EmployeeItem>) {
  const rawRecord = record as Record<string, unknown> | undefined;

  if (!rawRecord) {
    return null;
  }

  const role = rawRecord.role ?? rawRecord.Role;

  if (isObjectRecord(role) || typeof role === 'string') {
    return role;
  }

  const roles = rawRecord.roles ?? rawRecord.Roles;

  if (Array.isArray(roles)) {
    return (
      roles.find((item) => isObjectRecord(item) || typeof item === 'string') ??
      null
    );
  }

  return null;
}

function syncSelectedUserFromRecord(
  record?: null | Partial<EmployeeApi.EmployeeItem>,
) {
  const rawRecord = record as Record<string, unknown> | undefined;
  const user = rawRecord?.user ?? rawRecord?.User;

  selectedUser.value = isObjectRecord(user) ? user : null;
}

function syncPositionOptionFromRole(
  record?: null | Partial<EmployeeApi.EmployeeItem>,
) {
  const roleOption = normalizeRoleOption(getRecordRole(record));

  if (!roleOption) {
    if (isEditMode.value) {
      formData.position = null;
      positionOptions.value = [];
    }

    return;
  }

  formData.position = roleOption.value as NullableSelectValue;
  positionOptions.value = [roleOption];
}

async function loadDepartmentOptions() {
  if (departmentLoading.value || departmentOptions.value.length > 0) {
    return;
  }

  try {
    departmentLoading.value = true;
    const departments = await getEmployeeDepartmentOptionsApi();
    departmentOptions.value = normalizeOptionResponse(departments);
  } finally {
    departmentLoading.value = false;
  }
}

async function loadPositionOptions() {
  if (
    isEditMode.value ||
    positionLoading.value ||
    positionOptions.value.length > 0
  ) {
    return;
  }

  try {
    positionLoading.value = true;
    const positions = await getEmployeePositionOptionsApi();
    positionOptions.value = normalizeOptionResponse(positions);
  } finally {
    positionLoading.value = false;
  }
}

async function loadBankOptions() {
  if (bankLoading.value || bankOptionsLoaded.value) {
    return;
  }

  try {
    bankLoading.value = true;
    const banks = await getEmployeeBankOptionsApi();
    bankOptions.value = normalizeBankOptionResponse(banks);
    bankOptionsLoaded.value = true;
  } finally {
    bankLoading.value = false;
  }
}

function addBankItem() {
  formData.banks.push(createBankItem());
}

function removeBankItem(index: number) {
  formData.banks.splice(index, 1);
}

function normalizeRecord(
  record?: null | Partial<EmployeeApi.EmployeeItem>,
): EmployeeFormData {
  const initialValue = resetForm();

  if (!record) {
    return initialValue;
  }

  return {
    ...initialValue,
    address: record.address ?? null,
    banks: normalizeBankItems(record.banks),
    birthDate: toTimestamp(record.birthDate),
    concurrencyStamp: record.concurrencyStamp ?? null,
    department: record.department ?? null,
    email: record.email ?? null,
    employeeCode: record.employeeCode ?? null,
    enrollDate: record.enrollDate
      ? toTimestamp(record.enrollDate)
      : initialValue.enrollDate,
    gender: record.gender ?? null,
    id: record.id,
    identification: record.identification ?? null,
    maritalStatus: normalizeNumberValue(record.maritalStatus),
    name: record.name ?? '',
    national: record.national ?? null,
    phone: record.phone ?? '',
    position: record.position ?? null,
    resignationDate: toTimestamp(record.resignationDate),
    status: record.status ?? initialValue.status,
    taxCode: record.taxCode ?? null,
    userId: record.userId ?? null,
    userName: record.userName ?? null,
  };
}

function buildPayload(): EmployeeApi.EmployeeMutationPayload {
  return {
    address: normalizeText(formData.address),
    banks: normalizeBankPayload(),
    birthDate: toApiDate(formData.birthDate),
    concurrencyStamp: normalizeText(formData.concurrencyStamp),
    department: normalizeSelectValue(formData.department),
    email: normalizeText(formData.email),
    employeeCode: normalizeText(formData.employeeCode),
    enrollDate: toApiDate(formData.enrollDate),
    gender: formData.gender ?? null,
    identification: normalizeText(formData.identification),
    maritalStatus: normalizeNumberValue(formData.maritalStatus),
    name: formData.name.trim(),
    national: normalizeSelectValue(formData.national),
    phone: formData.phone.trim(),
    position: normalizeSelectValue(formData.position),
    resignationDate: toApiDate(formData.resignationDate),
    status: normalizeText(formData.status),
    taxCode: normalizeText(formData.taxCode),
    userId: normalizeText(formData.userId),
    userName: normalizeText(formData.userName),
  };
}

function getUserText(user: UserRecord, key: string) {
  const value = user[key];
  return typeof value === 'string' ? value : '';
}

function onUserSelected(user: UserRecord) {
  formData.userName = getUserText(user, 'userName') || null;
  formData.email = getUserText(user, 'email') || null;
  formData.phone =
    getUserText(user, 'phoneNumber') || getUserText(user, 'phone') || '';
}

watch(
  () => formData.userId,
  (userId) => {
    if (!userId) {
      formData.userName = null;
      formData.email = null;
      formData.phone = '';
    }
  },
);

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const payload = buildPayload();

    await (formData.id
      ? updateEmployeeApi(formData.id, payload)
      : createEmployeeApi(payload));

    message.success('Thao tác thành công');
    emit('submit', payload);
    drawerApi.close();
  } catch {
    message.error('Vui lòng kiểm tra lại thông tin');
  }
}

function handleReset() {
  const data = drawerApi.getData<{
    record: null | Partial<EmployeeApi.EmployeeItem>;
  }>();
  Object.assign(formData, normalizeRecord(data.record));
  syncSelectedUserFromRecord(data.record);
  syncPositionOptionFromRole(data.record);
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
      syncSelectedUserFromRecord(data.record);
      syncPositionOptionFromRole(data.record);
      void nextTick(() => formRef.value?.restoreValidation());
      void loadPositionOptions();
      return;
    }

    selectedUser.value = null;
    Object.assign(formData, resetForm());
    emit('update:open', false);
  },
});

const title = computed(() =>
  formData.id ? 'Sửa nhân viên' : 'Thêm nhân viên',
);

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
            :user="selectedUser"
            placeholder="Chọn người dùng"
            @user-selected="onUserSelected"
          />
        </NFormItemGi>

        <NFormItemGi label="Tên người dùng" path="userName">
          <NInput
            v-model:value="formData.userName"
            placeholder="Tên người dùng"
            readonly
          />
        </NFormItemGi>

        <NFormItemGi label="Mã nhân viên" path="employeeCode">
          <NInput
            v-model:value="formData.employeeCode"
            placeholder="Mã nhân viên"
            readonly
          />
        </NFormItemGi>

        <NFormItemGi label="Số điện thoại" path="phone">
          <NInput
            v-model:value="formData.phone"
            placeholder="Nhập số điện thoại"
          />
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
            :options="employeeGenderOptions"
            placeholder="Chọn giới tính"
          />
        </NFormItemGi>

        <NFormItemGi
          label="Vị trí"
          path="position"
          :feedback="
            isEditMode ? 'thay đổi trong quản lý người dùng.' : undefined
          "
        >
          <NSelect
            v-model:value="formData.position"
            clearable
            filterable
            :disabled="isEditMode"
            :loading="positionLoading"
            :options="positionOptions"
            placeholder="Chọn vị trí"
          />
        </NFormItemGi>

        <NFormItemGi label="Phòng ban" path="department">
          <NSelect
            v-model:value="formData.department"
            clearable
            filterable
            :loading="departmentLoading"
            :options="departmentOptions"
            placeholder="Chọn phòng ban"
            @focus="loadDepartmentOptions"
            @update:show="(show: boolean) => show && loadDepartmentOptions()"
          />
        </NFormItemGi>

        <NFormItemGi label="CCCD/Hộ Chiếu" path="identification">
          <NInput
            v-model:value="formData.identification"
            placeholder="Nhập CCCD/Hộ Chiếu"
          />
        </NFormItemGi>

        <NFormItemGi label="Mã số thuế" path="taxCode">
          <NInput
            v-model:value="formData.taxCode"
            placeholder="Nhập mã số thuế"
          />
        </NFormItemGi>

        <NFormItemGi label="Quốc tịch" path="national">
          <NSelect
            v-model:value="formData.national"
            clearable
            filterable
            :options="nationalOptions"
            placeholder="Chọn quốc tịch"
          />
        </NFormItemGi>

        <NFormItemGi label="Tình trạng hôn nhân" path="maritalStatus">
          <NSelect
            v-model:value="formData.maritalStatus"
            clearable
            filterable
            :options="employeeMaritalStatusOptions"
            placeholder="Chọn tình trạng hôn nhân"
          />
        </NFormItemGi>
      </NGrid>

      <NFormItem label="Ngân hàng" path="banks">
        <NSpace
          class="employee-bank-list"
          vertical
          :size="4"
          style="width: 100%"
        >
          <NButton dashed type="primary" @click="addBankItem">
            + Thêm ngân hàng
          </NButton>

          <NGrid
            v-for="(bankItem, index) in formData.banks"
            :key="bankItem.key"
            class="employee-bank-row"
            :cols="12"
            :x-gap="12"
          >
            <NFormItemGi
              class="employee-bank-field"
              :show-feedback="false"
              :span="3"
            >
              <NInput
                v-model:value="bankItem.accountNo"
                placeholder="Nhập số tài khoản"
              />
            </NFormItemGi>

            <NFormItemGi
              class="employee-bank-field"
              :show-feedback="false"
              :span="3"
            >
              <NInput
                v-model:value="bankItem.accountName"
                placeholder="Nhập tên tài khoản"
              />
            </NFormItemGi>

            <NFormItemGi
              class="employee-bank-field"
              :show-feedback="false"
              :span="4"
            >
              <NSelect
                v-model:value="bankItem.bankId"
                clearable
                filterable
                :loading="bankLoading"
                :options="bankOptions"
                placeholder="Chọn ngân hàng"
                @focus="loadBankOptions"
                @update:show="(show: boolean) => show && loadBankOptions()"
              />
            </NFormItemGi>

            <NFormItemGi
              class="employee-bank-field"
              :show-feedback="false"
              :span="2"
            >
              <NButton type="error" @click="removeBankItem(index)">
                Xóa
              </NButton>
            </NFormItemGi>
          </NGrid>
        </NSpace>
      </NFormItem>

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

      <NGrid :cols="2" :x-gap="16">
        <NFormItemGi label="Trạng thái" path="status">
          <NSelect
            v-model:value="formData.status"
            clearable
            :options="employeeStatusOptions"
            placeholder="Chọn trạng thái"
          />
        </NFormItemGi>
      </NGrid>
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

.employee-bank-list :deep(.employee-bank-row .n-form-item) {
  margin-bottom: 0;
}

.employee-bank-list :deep(.employee-bank-field .n-form-item-blank) {
  min-height: 34px;
}
</style>
