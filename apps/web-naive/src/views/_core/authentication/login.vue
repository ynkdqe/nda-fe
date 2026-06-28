<script lang="ts" setup>
import type { SelectOption } from 'naive-ui';

import type { VbenFormSchema } from '@vben/common-ui';

type LoginAccountOption = Omit<SelectOption, 'value'> & {
  value: null | string;
};

type LoginFormValues = {
  password?: string;
  tenant?: null | string;
  username?: string;
};

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const LOGIN_TENANT_STORAGE_KEY = 'web-naive:login-tenant';

const MOCK_USER_OPTIONS: LoginAccountOption[] = [
  {
    label: 'Admin',
    value: null,
  },
  {
    label: 'FRT',
    value: 'FRT',
  },
  {
    label: 'NDA',
    value: 'NDA',
  },
  {
    label: 'Golden Gate',
    value: 'GOLDEN GATE',
  },
];

function getStoredLoginTenant() {
  try {
    const tenant = localStorage.getItem(LOGIN_TENANT_STORAGE_KEY);
    const exists = MOCK_USER_OPTIONS.some((option) => option.value === tenant);

    return exists ? tenant : null;
  } catch {
    return null;
  }
}

function setStoredLoginTenant(tenant?: null | string) {
  try {
    if (tenant) {
      localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, tenant);
    } else {
      localStorage.removeItem(LOGIN_TENANT_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage errors in restricted browser contexts.
  }
}

async function handleSubmit(values: LoginFormValues) {
  setStoredLoginTenant(values.tenant ?? null);
  await authStore.authLogin(values);
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
      },
      defaultValue: getStoredLoginTenant(),
      fieldName: 'tenant',
      label: $t('authentication.selectAccount'),
      rules: z.nullable(z.string()).optional().default(null),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      defaultValue: 'admin',
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      defaultValue: '1q2w3E*',
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleSubmit"
  />
</template>
