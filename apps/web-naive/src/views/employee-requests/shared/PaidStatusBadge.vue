<script lang="ts" setup>
import { NTag } from 'naive-ui';

defineProps<{ paid: boolean }>();
</script>

<template>
  <NTag :type="paid ? 'success' : 'default'" size="small">
    {{ paid ? 'Có tính lương' : 'Không tính lương' }}
  </NTag>
</template>
