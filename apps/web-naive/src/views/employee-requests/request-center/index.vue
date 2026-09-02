<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api/hr/employee';
import type { EmployeeRequestApi } from '#/models/employee-requests/employee-request';
import type { EmployeeRequestPolicyApi } from '#/models/employee-requests/employee-request-policy';
import type { EmployeeRequestReasonApi } from '#/models/employee-requests/employee-request-reason';
import type { EmployeeRequestTypeApi } from '#/models/employee-requests/employee-request-type';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NDropdown,
  NInput,
  NModal,
  NSpace,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveEmployeeRequestApi,
  approveManyEmployeeRequestsApi,
  cancelEmployeeRequestApi,
  createEmployeeRequestApi,
  deleteEmployeeRequestApi,
  getEmployeeListApi,
  getEmployeeRequestByIdApi,
  getEmployeeRequestListApi,
  getEmployeeRequestOptionsApi,
  getEmployeeRequestReasonListApi,
  getEmployeeRequestTypeListApi,
  rejectEmployeeRequestApi,
  revokeEmployeeRequestApi,
  updateEmployeeRequestApi,
} from '#/api';
import { EMPLOYEE_REQUEST_PERMISSIONS } from '#/constants/employee-request';
import {
  EmployeeRequestStatus,
  employeeRequestStatusOptions,
} from '#/models/employee-requests/employee-request';
import { formatDateOnly, formatDateTime, toDateOnlyString } from '#/utils/date';

import EmployeeRequestStatusBadge from '../shared/EmployeeRequestStatusBadge.vue';
import EmployeeRequestDetail from './EmployeeRequestDetail.vue';
import EmployeeRequestForm from './EmployeeRequestForm.vue';

const { hasAccessByCodes } = useAccess();

/**
 * Backend dùng chính quyền Approve để quyết định người dùng thấy toàn bộ đơn
 * hay chỉ đơn của mình, nên FE dùng lại đúng code đó cho các nút duyệt.
 */
const canApprove = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.approve]),
);
const canReject = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.reject]),
);
const canRevoke = computed(() =>
  hasAccessByCodes([EMPLOYEE_REQUEST_PERMISSIONS.revoke]),
);

const types = ref<EmployeeRequestTypeApi.Item[]>([]);
const reasons = ref<EmployeeRequestReasonApi.Item[]>([]);
const employees = ref<EmployeeApi.EmployeeItem[]>([]);
// Dùng để tra "có tính lương hay không" theo lý do đã chọn khi tạo/sửa đơn.
const policies = ref<EmployeeRequestPolicyApi.Item[]>([]);
const processingId = ref<null | number>(null);
const rejectReason = ref('');

/**
 * Tab `approval` là màn hình dành cho người duyệt: luôn ép trạng thái Chờ duyệt
 * để chỉ còn các đơn cần xử lý. Backend đã tự giới hạn phạm vi dữ liệu theo quyền
 * Approve (có quyền thì thấy toàn bộ đơn của tenant, không có thì chỉ thấy đơn của mình).
 */
type RequestTab = 'all' | 'approval';

const activeTab = ref<RequestTab>('all');
const isApprovalTab = computed(() => activeTab.value === 'approval');

const typeMap = computed(() => new Map(types.value.map((x) => [x.id, x])));
const reasonMap = computed(() => new Map(reasons.value.map((x) => [x.id, x])));
const employeeMap = computed(
  () => new Map(employees.value.map((x) => [Number(x.id), x])),
);

async function loadDependencies() {
  // Chính sách còn hiệu lực hôm nay là nguồn dữ liệu cho dropdown của form tạo đơn.
  const today = toDateOnlyString(Date.now()) ?? undefined;

  /**
   * Dùng allSettled chứ không phải all: ba API danh mục bên dưới đòi quyền quản trị
   * mà nhân viên thường không có, và Promise.all sẽ để một lời gọi 403 kéo sập cả hàm,
   * khiến form mất sạch dropdown dù API options chạy bình thường.
   */
  const [typeResult, reasonResult, employeeResult, optionResult] =
    await Promise.allSettled([
      getEmployeeRequestTypeListApi({ current: 1, pageSize: 100 }),
      getEmployeeRequestReasonListApi({ current: 1, pageSize: 100 }),
      getEmployeeListApi({ current: 1, pageSize: 100 }),
      getEmployeeRequestOptionsApi(today),
    ]);

  types.value =
    typeResult.status === 'fulfilled'
      ? (typeResult.value.data ?? [])
          .filter((x) => !x.isDeleted)
          .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
      : [];

  reasons.value =
    reasonResult.status === 'fulfilled'
      ? (reasonResult.value.data ?? []).filter((x) => !x.isDeleted)
      : [];

  employees.value =
    employeeResult.status === 'fulfilled'
      ? (employeeResult.value.data ?? [])
      : [];

  policies.value =
    optionResult.status === 'fulfilled'
      ? (optionResult.value.data ?? []).filter((x) => !x.isDeleted)
      : [];
}

const formOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  schema: [
    {
      component: 'Select',
      fieldName: 'type',
      label: 'Loại đơn',
      componentProps: () => ({
        clearable: true,
        options: types.value.map((x) => ({ label: x.name, value: x.id })),
      }),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: 'Trạng thái',
      // Tab duyệt đơn đã cố định trạng thái Chờ duyệt nên ẩn filter này để tránh hiểu nhầm.
      dependencies: {
        show: () => !isApprovalTab.value,
        triggerFields: ['status'],
      },
      componentProps: {
        clearable: true,
        options: [...employeeRequestStatusOptions],
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'dateRange',
      label: 'Ngày tạo',
      componentProps: {
        clearable: true,
        format: 'dd/MM/yyyy',
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
      },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: 'Từ khóa',
      componentProps: { clearable: true, placeholder: 'Tìm theo mô tả' },
    },
  ],
};

const gridOptions: VxeGridProps<EmployeeRequestApi.Item> = {
  border: 'full',
  columns: [
    // Cột tick chỉ có nghĩa ở tab duyệt, nơi mọi đơn đều đang chờ duyệt.
    {
      type: 'checkbox',
      width: 50,
      visible: false,
      field: 'bulkSelect',
    },
    { align: 'center', title: 'STT', type: 'seq', width: 70 },
    { field: 'id', title: 'Mã đơn', width: 90, slots: { default: 'codeCell' } },
    {
      field: 'employeeId',
      title: 'Nhân viên',
      minWidth: 180,
      slots: { default: 'employeeCell' },
    },
    {
      field: 'employeeRequestTypeId',
      title: 'Loại đơn',
      minWidth: 160,
      slots: { default: 'typeCell' },
    },
    {
      field: 'employeeRequestReasonId',
      title: 'Lý do',
      minWidth: 160,
      slots: { default: 'reasonCell' },
    },
    {
      field: 'periods',
      title: 'Thời gian nghỉ',
      minWidth: 200,
      slots: { default: 'periodCell' },
    },
    { field: 'description', title: 'Mô tả', minWidth: 200 },
    {
      align: 'center',
      field: 'status',
      title: 'Trạng thái',
      width: 130,
      slots: { default: 'statusCell' },
    },
    {
      field: 'creationTime',
      title: 'Ngày tạo',
      width: 160,
      slots: { default: 'createdCell' },
    },
    {
      align: 'center',
      fixed: 'right',
      title: 'Thao tác',
      width: 170,
      slots: { default: 'actions' },
    },
  ],
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, values: Record<string, any>) => {
        const [startDate, endDate] = values?.dateRange ?? [];
        // Tab duyệt đơn luôn ép trạng thái Chờ duyệt, bỏ qua filter trạng thái của người dùng.
        const status = isApprovalTab.value
          ? String(EmployeeRequestStatus.Pending)
          : (typeof values?.status === 'number'
            ? String(values.status)
            : undefined);
        const params: EmployeeRequestApi.ListParams = {
          current: page.currentPage,
          pageSize: page.pageSize,
          ...(typeof values?.type === 'number'
            ? { type: String(values.type) }
            : {}),
          ...(status === undefined ? {} : { status }),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(values?.keyword ? { keyword: values.keyword } : {}),
        };

        const response = await getEmployeeRequestListApi(params);
        const items = (response.data ?? []).filter((x) => !x.isDeleted);
        return { items, total: response.total ?? items.length };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: { custom: true, export: true, search: true } as any,
};

const [Grid, gridApi] = useVbenVxeGrid<EmployeeRequestApi.Item>({
  formOptions,
  gridOptions,
});
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestForm,
});
const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: EmployeeRequestDetail,
});

async function changeTab(value: RequestTab) {
  activeTab.value = value;
  // Cột tick chỉ hiện ở tab duyệt; đổi tab thì bỏ luôn lựa chọn cũ để tránh duyệt nhầm.
  gridApi.grid?.clearCheckboxRow?.();
  await gridApi.setGridOptions({
    columns: gridOptions.columns?.map((column: any) =>
      column.field === 'bulkSelect'
        ? { ...column, visible: isApprovalTab.value }
        : column,
    ),
  });
  await gridApi.query();
}

function employeeName(row: EmployeeRequestApi.Item) {
  return (
    row.employee?.name ??
    employeeMap.value.get(row.employeeId)?.name ??
    `#${row.employeeId}`
  );
}

/**
 * Tên loại đơn và lý do lấy lần lượt từ navigation của đơn, danh mục đã tải,
 * rồi mới tới danh sách chính sách. Bước cuối để nhân viên không có quyền đọc
 * danh mục vẫn thấy tên thay vì dấu gạch.
 */
function typeName(row: EmployeeRequestApi.Item) {
  return (
    row.employeeRequestType?.name ??
    typeMap.value.get(row.employeeRequestTypeId)?.name ??
    policies.value.find(
      (policy) => policy.employeeRequestTypeId === row.employeeRequestTypeId,
    )?.employeeRequestTypeName ??
    '-'
  );
}

function reasonName(row: EmployeeRequestApi.Item) {
  return (
    row.employeeRequestReason?.name ??
    reasonMap.value.get(row.employeeRequestReasonId)?.name ??
    policies.value.find(
      (policy) =>
        policy.employeeRequestReasonId === row.employeeRequestReasonId,
    )?.employeeRequestReasonName ??
    '-'
  );
}

function periodSummary(row: EmployeeRequestApi.Item) {
  const periods = row.periods ?? [];
  if (periods.length === 0) {
    return '-';
  }

  const first = periods[0];
  if (!first) {
    return '-';
  }

  const range =
    first.fromDate === first.toDate
      ? formatDateOnly(first.fromDate)
      : `${formatDateOnly(first.fromDate)} - ${formatDateOnly(first.toDate)}`;

  return periods.length > 1 ? `${range} (+${periods.length - 1})` : range;
}

function openCreate() {
  formDrawerApi.setData({
    policies: policies.value,
    record: null,
  });
  formDrawerApi.open();
}

async function openEdit(row: EmployeeRequestApi.Item) {
  // Lấy bản chi tiết để có Periods, vì API danh sách không trả kèm.
  const response = await getEmployeeRequestByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy đơn');
    return;
  }

  formDrawerApi.setData({
    policies: policies.value,
    record: response.data,
  });
  formDrawerApi.open();
}

async function openDetail(row: EmployeeRequestApi.Item) {
  const response = await getEmployeeRequestByIdApi(row.id);
  if (!response.data) {
    message.error(response.message ?? 'Không tìm thấy đơn');
    return;
  }

  detailDrawerApi.setData({ record: response.data });
  detailDrawerApi.open();
}

async function submit(
  payload: EmployeeRequestApi.CreateInput | EmployeeRequestApi.UpdateInput,
) {
  formDrawerApi.setState({ confirmLoading: true });
  try {
    if ('id' in payload) {
      await updateEmployeeRequestApi(payload.id, payload);
      message.success('Cập nhật đơn thành công');
    } else {
      await createEmployeeRequestApi(payload);
      message.success('Tạo đơn thành công');
    }
    formDrawerApi.close();
    await gridApi.query();
  } finally {
    formDrawerApi.setState({ confirmLoading: false });
  }
}

async function remove(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await deleteEmployeeRequestApi(row.id);
    message.success('Xóa đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function approve(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await approveEmployeeRequestApi(row.id);
    message.success('Duyệt đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

async function cancel(row: EmployeeRequestApi.Item) {
  if (processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    await cancelEmployeeRequestApi(row.id);
    message.success('Hủy đơn thành công');
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

/**
 * Từ chối và thu hồi đều cần lý do nên dùng chung một hộp thoại nhập liệu,
 * mở từ menu thao tác thay vì popconfirm gắn sẵn trên từng nút như trước.
 */
const reasonDialogOpen = ref(false);
const reasonDialogAction = ref<'reject' | 'revoke'>('reject');
const reasonDialogRow = ref<EmployeeRequestApi.Item | null>(null);

const reasonDialogTitle = computed(() =>
  reasonDialogAction.value === 'reject' ? 'Từ chối đơn' : 'Thu hồi đơn',
);

function openReasonDialog(
  row: EmployeeRequestApi.Item,
  action: 'reject' | 'revoke',
) {
  reasonDialogRow.value = row;
  reasonDialogAction.value = action;
  rejectReason.value = '';
  reasonDialogOpen.value = true;
}

async function confirmReasonDialog() {
  const row = reasonDialogRow.value;
  if (row === null || processingId.value !== null) {
    return;
  }

  processingId.value = row.id;
  try {
    const payload = { reason: rejectReason.value.trim() || null };
    if (reasonDialogAction.value === 'reject') {
      await rejectEmployeeRequestApi(row.id, payload);
      message.success('Từ chối đơn thành công');
    } else {
      await revokeEmployeeRequestApi(row.id, payload);
      message.success('Thu hồi đơn thành công');
    }
    reasonDialogOpen.value = false;
    rejectReason.value = '';
    await gridApi.query();
  } finally {
    processingId.value = null;
  }
}

/**
 * Duyệt hàng loạt các đơn đang được tick trong lưới. Backend xử lý từng đơn độc lập
 * nên đơn không hợp lệ chỉ bị bỏ qua, không làm hỏng cả lượt duyệt.
 */
const bulkApproving = ref(false);

async function approveSelected() {
  const rows = gridApi.grid?.getCheckboxRecords?.() ?? [];
  const ids = rows.filter((row) => isPending(row)).map((row) => row.id);

  if (ids.length === 0) {
    message.warning('Chưa chọn đơn nào đang chờ duyệt');
    return;
  }

  dialog.warning({
    content: `Duyệt ${ids.length} đơn đã chọn?`,
    negativeText: 'Hủy',
    positiveText: 'Duyệt tất cả',
    title: 'Xác nhận duyệt hàng loạt',
    onPositiveClick: async () => {
      bulkApproving.value = true;
      try {
        const response = await approveManyEmployeeRequestsApi(ids);
        const failed = response.data?.failed ?? [];
        if (failed.length > 0) {
          // Nêu rõ đơn nào bị bỏ qua để người duyệt còn xử lý tiếp.
          message.warning(
            `${response.message ?? ''} Bỏ qua: ${failed
              .map((item) => `#${item.id} (${item.reason})`)
              .join(', ')}`,
          );
        } else {
          message.success(response.message ?? `Đã duyệt ${ids.length} đơn`);
        }
        gridApi.grid?.clearCheckboxRow?.();
        await gridApi.query();
      } finally {
        bulkApproving.value = false;
      }
    },
  });
}

function isPending(row: EmployeeRequestApi.Item) {
  return row.status === EmployeeRequestStatus.Pending;
}

function isApproved(row: EmployeeRequestApi.Item) {
  return row.status === EmployeeRequestStatus.Approved;
}

type ActionKey =
  | 'approve'
  | 'cancel'
  | 'delete'
  | 'detail'
  | 'edit'
  | 'reject'
  | 'revoke';

/** Menu thao tác dựng theo trạng thái đơn và quyền của người dùng. */
function actionOptions(row: EmployeeRequestApi.Item) {
  const options: Array<{ key: ActionKey; label: string }> = [
    { key: 'detail', label: 'Xem chi tiết' },
  ];

  if (isPending(row)) {
    options.push({ key: 'edit', label: 'Sửa đơn' });

    if (canApprove.value) {
      options.push({ key: 'approve', label: 'Duyệt đơn' });
    }
    if (canReject.value) {
      options.push({ key: 'reject', label: 'Từ chối đơn' });
    }

    options.push(
      { key: 'cancel', label: 'Hủy đơn của tôi' },
      { key: 'delete', label: 'Xóa đơn' },
    );
  }

  if (isApproved(row) && canRevoke.value) {
    options.push({ key: 'revoke', label: 'Thu hồi đơn' });
  }

  return options;
}

function handleAction(row: EmployeeRequestApi.Item, key: number | string) {
  switch (key as ActionKey) {
    case 'approve': {
      dialog.warning({
        content: `Duyệt đơn #${row.id} của ${employeeName(row)}?`,
        negativeText: 'Hủy',
        onPositiveClick: () => void approve(row),
        positiveText: 'Duyệt',
        title: 'Xác nhận duyệt đơn',
      });
      break;
    }
    case 'cancel': {
      dialog.warning({
        content: `Hủy đơn #${row.id}? Chỉ người tạo đơn mới hủy được.`,
        negativeText: 'Không',
        onPositiveClick: () => void cancel(row),
        positiveText: 'Hủy đơn',
        title: 'Xác nhận hủy đơn',
      });
      break;
    }
    case 'delete': {
      dialog.error({
        content: `Xóa đơn #${row.id}?`,
        negativeText: 'Không',
        onPositiveClick: () => void remove(row),
        positiveText: 'Xóa',
        title: 'Xác nhận xóa đơn',
      });
      break;
    }
    case 'detail': {
      void openDetail(row);
      break;
    }
    case 'edit': {
      void openEdit(row);
      break;
    }
    case 'reject': {
      openReasonDialog(row, 'reject');
      break;
    }
    case 'revoke': {
      openReasonDialog(row, 'revoke');
      break;
    }
  }
}

onMounted(loadDependencies);
</script>

<template>
  <Page>
    <NTabs
      v-if="canApprove"
      class="mb-2"
      type="line"
      :value="activeTab"
      @update:value="changeTab"
    >
      <NTabPane name="all" tab="Tất cả đơn từ" />
      <NTabPane name="approval" tab="Đơn cần phê duyệt" />
    </NTabs>

    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="openCreate">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          Tạo đơn mới
        </NButton>

        <NButton
          v-if="isApprovalTab && canApprove"
          class="ml-2"
          :loading="bulkApproving"
          type="success"
          @click="approveSelected"
        >
          <template #icon>
            <IconifyIcon icon="lucide:check-check" />
          </template>
          Duyệt các đơn đã chọn
        </NButton>
      </template>

      <template #codeCell="{ row }">#{{ row.id }}</template>

      <template #employeeCell="{ row }">{{ employeeName(row) }}</template>

      <template #typeCell="{ row }">{{ typeName(row) }}</template>

      <template #reasonCell="{ row }">{{ reasonName(row) }}</template>

      <template #periodCell="{ row }">{{ periodSummary(row) }}</template>

      <template #statusCell="{ row }">
        <EmployeeRequestStatusBadge :status="row.status" />
      </template>

      <template #createdCell="{ row }">
        {{ formatDateTime(row.creationTime) }}
      </template>

      <template #actions="{ row }">
        <NDropdown
          :options="actionOptions(row)"
          trigger="click"
          @select="(key) => handleAction(row, key)"
        >
          <NButton
            circle
            :disabled="processingId !== null"
            :loading="processingId === row.id"
            quaternary
            size="small"
          >
            <template #icon>
              <IconifyIcon class="size-4" icon="lucide:ellipsis-vertical" />
            </template>
          </NButton>
        </NDropdown>
      </template>
    </Grid>

    <FormDrawer @submit="submit" />
    <DetailDrawer />

    <NModal
      v-model:show="reasonDialogOpen"
      :mask-closable="false"
      preset="dialog"
      :title="reasonDialogTitle"
    >
      <NInput
        v-model:value="rejectReason"
        :autosize="{ maxRows: 5, minRows: 3 }"
        maxlength="500"
        placeholder="Nhập lý do (không bắt buộc)"
        show-count
        type="textarea"
      />
      <template #action>
        <NSpace justify="end">
          <NButton @click="reasonDialogOpen = false">Hủy</NButton>
          <NButton
            :loading="processingId !== null"
            type="primary"
            @click="confirmReasonDialog"
          >
            Xác nhận
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </Page>
</template>
