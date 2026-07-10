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

import { computed, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { isSsoAuthMode } from '#/auth/sso';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const ssoMode = isSsoAuthMode();
const ssoError = ref('');

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

onMounted(async () => {
  if (!ssoMode) {
    return;
  }

  try {
    await authStore.startSsoLogin();
  } catch (error) {
    ssoError.value =
      error instanceof Error ? error.message : 'Không thể chuyển đến trang SSO.';
  }
});

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
      defaultValue: '123456aA@',
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});
</script>

<template>
  <div
    v-if="ssoMode"
    class="flex min-h-40 flex-col items-center justify-center gap-4 text-center"
  >
    <template v-if="ssoError">
      <p class="text-destructive">{{ ssoError }}</p>
      <button class="vben-link" type="button" @click="authStore.startSsoLogin()">
        Thử lại
      </button>
    </template>
    <template v-else>
      <div
        class="size-8 animate-spin rounded-full border-2 border-current border-t-transparent"
      ></div>
      <p>Đang chuyển đến trang đăng nhập SSO...</p>
    </template>
  </div>
  <AuthenticationLogin
    v-else
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleSubmit"
  />
</template>
