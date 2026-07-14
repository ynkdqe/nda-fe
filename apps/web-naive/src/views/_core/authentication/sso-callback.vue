<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

import { useAuthStore } from '#/store';

const authStore = useAuthStore();
const router = useRouter();
const errorMessage = ref('');

onMounted(async () => {
  try {
    await authStore.completeSsoLogin(window.location.search);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Không thể hoàn tất đăng nhập SSO.';
  }
});

async function retryLogin() {
  await router.replace(LOGIN_PATH);
}
</script>

<template>
  <div
    class="flex min-h-40 flex-col items-center justify-center gap-4 text-center"
  >
    <template v-if="errorMessage">
      <p class="text-destructive">{{ errorMessage }}</p>
      <button class="vben-link" type="button" @click="retryLogin">
        Thử đăng nhập lại
      </button>
    </template>
    <template v-else>
      <div
        class="size-8 animate-spin rounded-full border-2 border-current border-t-transparent"
      ></div>
      <p>Đang hoàn tất đăng nhập SSO...</p>
    </template>
  </div>
</template>
