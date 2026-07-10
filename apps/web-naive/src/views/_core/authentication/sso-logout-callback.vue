<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

const router = useRouter();

onMounted(async () => {
  await router.replace(LOGIN_PATH);
});
</script>

<template>
  <div
    class="flex min-h-40 flex-col items-center justify-center gap-4 text-center"
  >
    <div
      class="size-8 animate-spin rounded-full border-2 border-current border-t-transparent"
    ></div>
    <p>Đã đăng xuất. Đang chuyển đến trang đăng nhập SSO...</p>
  </div>
</template>
