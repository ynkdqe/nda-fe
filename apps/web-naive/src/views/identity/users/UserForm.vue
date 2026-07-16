<script setup lang="ts">
import type { FormInst, FormRules, SelectOption } from 'naive-ui';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { requestClient } from '#/api/request';

export type UserFormModel = {
  concurrencyStamp?: null | string;
  email?: null | string;
  id?: number | string;
  isActive?: boolean;
  lockoutEnabled?: boolean;
  name?: null | string;
  organizationUnits?: string[];
  phoneNumber?: null | string;
  roles?: string[];
  surname?: null | string;
  userName?: null | string;
};

type OrganizationUnitOption = SelectOption & {
  code?: string;
};

const emit = defineEmits<{
  submit: [data: UserFormModel];
}>();

const formRef = ref<FormInst | null>(null);

const form = reactive<UserFormModel>({
  concurrencyStamp: null,
  email: null,
  isActive: true,
  lockoutEnabled: false,
  name: null,
  organizationUnits: [],
  phoneNumber: null,
  roles: [],
  surname: null,
  userName: null,
});

const rules: FormRules = {
  email: [
    {
      message: 'Vui lòng nhập email',
      required: true,
      trigger: ['blur', 'input'],
    },
    {
      message: 'Email không hợp lệ',
      trigger: ['blur', 'input'],
      type: 'email',
    },
  ],
  userName: [
    {
      message: 'Vui lòng nhập tên đăng nhập',
      required: true,
      trigger: ['blur', 'input'],
    },
    {
      max: 64,
      message: 'Tên đăng nhập tối đa 64 ký tự',
      trigger: ['blur', 'input'],
    },
  ],
};

const roleOptions = ref<SelectOption[]>([]);
const roleLoading = ref(false);
const roleSearchTimer = ref<number>();
const rolePageSize = 20;

const orgOptions = ref<OrganizationUnitOption[]>([]);
const orgLoading = ref(false);
const orgSearchTimer = ref<number>();
const orgPageSize = 50;

function resetForm() {
  Object.assign(form, {
    concurrencyStamp: null,
    email: null,
    id: undefined,
    isActive: true,
    lockoutEnabled: false,
    name: null,
    organizationUnits: [],
    phoneNumber: null,
    roles: [],
    surname: null,
    userName: null,
  });
  formRef.value?.restoreValidation();
}

function fillForm(record?: null | Partial<UserFormModel>) {
  Object.assign(form, {
    concurrencyStamp: record?.concurrencyStamp ?? null,
    email: record?.email ?? null,
    id: record?.id,
    isActive: record?.isActive ?? true,
    lockoutEnabled: !!record?.lockoutEnabled,
    name: record?.name ?? null,
    organizationUnits: record?.organizationUnits ?? [],
    phoneNumber: record?.phoneNumber ?? null,
    roles: record?.roles ?? [],
    surname: record?.surname ?? null,
    userName: record?.userName ?? null,
  });
  formRef.value?.restoreValidation();
}

function mergeSelectedOptions(
  options: SelectOption[],
  selectedValues?: Array<number | string>,
) {
  const selected = (selectedValues ?? []).filter(Boolean);
  const missing = selected.filter(
    (value) => !options.some((option) => option.value === value),
  );

  return [
    ...options,
    ...missing.map((value) => ({
      label: String(value),
      value,
    })),
  ];
}

async function fetchRoles(keyword = '') {
  try {
    roleLoading.value = true;
    const response = await requestClient.get<any>('/api/identity/roles', {
      params: {
        filter: keyword.trim() || undefined,
        maxResultCount: rolePageSize,
        skipCount: 0,
      },
      responseReturn: 'body',
    });
    const items = response?.items ?? response?.data?.items ?? response ?? [];
    const options = Array.isArray(items)
      ? items.map((item: any) => ({
          label: item?.name ?? item?.displayName ?? item?.id,
          value: item?.name ?? item?.id,
        }))
      : [];

    roleOptions.value = mergeSelectedOptions(options, form.roles);
  } finally {
    roleLoading.value = false;
  }
}

function handleRoleSearch(value: string) {
  if (roleSearchTimer.value) {
    window.clearTimeout(roleSearchTimer.value);
  }

  roleSearchTimer.value = window.setTimeout(() => fetchRoles(value), 300);
}

async function fetchOrganizationUnits(keyword = '') {
  try {
    orgLoading.value = true;
    const response = await requestClient.get<any>(
      '/api/identity/organization-unit',
      {
        responseReturn: 'body',
      },
    );
    const items = response?.data ?? response ?? [];
    const normalized: OrganizationUnitOption[] = Array.isArray(items)
      ? items.map((item: any) => ({
          code: item?.code,
          label: item?.displayName ?? item?.code ?? item?.id,
          value: item?.id,
        }))
      : [];
    const searchText = keyword.trim().toLowerCase();
    const filtered = searchText
      ? normalized.filter(
          (option) =>
            String(option.label ?? '')
              .toLowerCase()
              .includes(searchText) ||
            String(option.code ?? '')
              .toLowerCase()
              .includes(searchText),
        )
      : normalized;

    orgOptions.value = mergeSelectedOptions(
      filtered.slice(0, orgPageSize),
      form.organizationUnits,
    );
  } finally {
    orgLoading.value = false;
  }
}

function handleOrgSearch(value: string) {
  if (orgSearchTimer.value) {
    window.clearTimeout(orgSearchTimer.value);
  }

  orgSearchTimer.value = window.setTimeout(
    () => fetchOrganizationUnits(value),
    300,
  );
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', {
    ...form,
    email: form.email?.trim() || null,
    name: form.name?.trim() || null,
    phoneNumber: form.phoneNumber?.trim() || null,
    surname: form.surname?.trim() || null,
    userName: form.userName?.trim() || null,
  });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
      return;
    }

    const data = drawerApi.getData<{
      record?: null | Partial<UserFormModel>;
    }>();
    resetForm();
    fillForm(data.record);
    fetchRoles();
    fetchOrganizationUnits();
  },
});

const title = computed(() => (form.id ? 'Sửa người dùng' : 'Thêm người dùng'));

defineExpose({ drawerApi, resetForm });
</script>

<template>
  <Drawer :title="title" class="md:w-[760px]">
    <div class="p-4">
      <NTabs default-value="info" type="line" animated>
        <NTabPane name="info" tab="Thông tin">
          <NForm
            ref="formRef"
            :model="form"
            :rules="rules"
            label-placement="top"
            require-mark-placement="right-hanging"
          >
            <NFormItem label="Tên đăng nhập" path="userName" required>
              <NInput
                v-model:value="form.userName"
                placeholder="Nhập tên đăng nhập"
              />
            </NFormItem>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NFormItem label="Tên" path="name">
                <NInput v-model:value="form.name" placeholder="Nhập tên" />
              </NFormItem>
              <NFormItem label="Họ" path="surname">
                <NInput v-model:value="form.surname" placeholder="Nhập họ" />
              </NFormItem>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NFormItem label="Email" path="email" required>
                <NInput v-model:value="form.email" placeholder="Nhập email" />
              </NFormItem>
              <NFormItem label="Số điện thoại" path="phoneNumber">
                <NInput
                  v-model:value="form.phoneNumber"
                  placeholder="Nhập số điện thoại"
                />
              </NFormItem>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-6">
              <div class="flex items-center gap-3">
                <NSwitch v-model:value="form.isActive" />
                <span class="font-medium">Hoạt động</span>
              </div>
              <div class="flex items-center gap-3">
                <NSwitch v-model:value="form.lockoutEnabled" />
                <span class="font-medium">Cho phép khóa tài khoản</span>
              </div>
            </div>
          </NForm>
        </NTabPane>

        <NTabPane name="roles" tab="Vai trò">
          <div class="space-y-3 p-2">
            <div class="text-sm text-gray-500">
              Chọn một hoặc nhiều vai trò cho người dùng.
            </div>
            <NForm label-placement="top">
              <NFormItem label="Vai trò">
                <NSelect
                  v-model:value="form.roles"
                  multiple
                  filterable
                  remote
                  clearable
                  :options="roleOptions"
                  :loading="roleLoading"
                  placeholder="Tìm và chọn vai trò"
                  @search="handleRoleSearch"
                  @focus="fetchRoles()"
                />
              </NFormItem>
            </NForm>
          </div>
        </NTabPane>

        <NTabPane name="organization-units" tab="Đơn vị tổ chức">
          <div class="space-y-3 p-2">
            <div class="text-sm text-gray-500">
              Chọn các đơn vị tổ chức mà người dùng thuộc về.
            </div>
            <NForm label-placement="top">
              <NFormItem label="Đơn vị tổ chức">
                <NSelect
                  v-model:value="form.organizationUnits"
                  multiple
                  filterable
                  remote
                  clearable
                  :options="orgOptions"
                  :loading="orgLoading"
                  placeholder="Tìm và chọn đơn vị tổ chức"
                  @search="handleOrgSearch"
                  @focus="fetchOrganizationUnits()"
                />
              </NFormItem>
            </NForm>
          </div>
        </NTabPane>
      </NTabs>
    </div>
  </Drawer>
</template>
