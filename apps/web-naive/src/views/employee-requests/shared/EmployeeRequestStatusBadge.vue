<script lang="ts" setup>
import { computed } from 'vue';

import { NTag } from 'naive-ui';

import {
  EmployeeRequestStatus,
  employeeRequestStatusLabels,
} from '#/models/employee-requests/employee-request';

const props = defineProps<{ status: EmployeeRequestStatus }>();

const tagType = computed<'default' | 'error' | 'success' | 'warning'>(() => {
  switch (props.status) {
    case EmployeeRequestStatus.Approved: {
      return 'success';
    }
    case EmployeeRequestStatus.Cancelled: {
      return 'default';
    }
    case EmployeeRequestStatus.Rejected: {
      return 'error';
    }
    default: {
      return 'warning';
    }
  }
});

const label = computed(
  () => employeeRequestStatusLabels[props.status] ?? 'Không xác định',
);
</script>

<template>
  <NTag :bordered="false" :type="tagType" size="small">{{ label }}</NTag>
</template>
