<script lang="ts" setup>
import type { RoleFormModel } from './components/RoleForm.vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { NButton, NDropdown, NSwitch } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { requestClient } from '#/api/request';
import { createRole, deleteRole, editRole } from '#/api/role/role';
import Permission from '#/components/Permission.vue';

import RoleForm from './components/RoleForm.vue';

interface RoleItem {
  concurrencyStamp?: string;
  creationTime: number | string;
  id: string;
  isDefault?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
  name: string;
}

type DropdownKey = 'delete' | 'edit' | 'permission';

const dropdownOptions: Array<{ key: DropdownKey; label: string }> = [
  { key: 'edit', label: 'Sửa' },
  { key: 'permission', label: 'Quyền' },
  { key: 'delete', label: 'Xóa' },
];

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: 'Nhập tên vai trò...' },
      fieldName: 'keyword',
      label: 'Từ khóa',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: 'Tìm kiếm' },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<RoleItem> = {
  border: 'full',
  columns: [
    {
      align: 'center',
      fixed: 'left',
      slots: { default: 'actions' },
      title: 'Thao tác',
      width: 100,
    },
    { align: 'center', title: '#', type: 'seq', width: 60 },
    { field: 'name', minWidth: 180, title: 'Tên vai trò' },
    {
      field: 'isDefault',
      slots: { default: 'boolDefault' },
      title: 'Mặc định',
      width: 120,
    },
    {
      field: 'isStatic',
      slots: { default: 'boolStatic' },
      title: 'Tĩnh',
      width: 120,
    },
    {
      field: 'isPublic',
      slots: { default: 'boolPublic' },
      title: 'Công khai',
      width: 120,
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }: any) =>
        cellValue ? formatDateTime(cellValue) : '-',
      title: 'Ngày tạo',
      width: 200,
    },
  ],
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const current = page.currentPage ?? 1;
        const pageSize = page.pageSize ?? 10;
        const res = await requestClient.get<any>('/api/identity/roles', {
          params: {
            filter: formValues?.keyword?.trim?.() || undefined,
            maxResultCount: pageSize,
            skipCount: (current - 1) * pageSize,
          },
          responseReturn: 'body',
        });
        const items = res?.items ?? res?.data?.items ?? res ?? [];
        const total =
          res?.totalCount ?? res?.data?.totalCount ?? items.length ?? 0;
        return { items, total } as any;
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: true,
    // @ts-ignore
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<RoleItem>({ formOptions, gridOptions });

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: RoleForm,
});

function openCreate() {
  drawerApi.setData({ record: null });
  drawerApi.open();
}

function onEdit(row: RoleItem) {
  drawerApi.setData({ record: row });
  drawerApi.open();
}

function onDelete(row: RoleItem) {
  dialog.warning({
    title: 'Xác nhận xóa',
    content: `Bạn có chắc muốn xóa vai trò "${row.name}" không?`,
    positiveText: 'Xóa',
    negativeText: 'Hủy',
    onPositiveClick: async () => {
      try {
        await deleteRole(row.id);
        message.success('Xóa vai trò thành công');
        gridApi.query();
      } catch {
        // handled by request interceptor
      }
    },
  });
}

// Permission drawer state
const showPermission = ref(false);
const permissionProviderName = ref('R');
const permissionProviderKey = ref('');
const permissionTitle = ref('');

function handleMenu(row: RoleItem, key: number | string) {
  const menuKey = String(key) as DropdownKey;
  switch (menuKey) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'permission': {
      permissionProviderName.value = 'R';
      permissionProviderKey.value = row.name; // roles use name, not id
      permissionTitle.value = `Quyền của vai trò: ${row.name}`;
      showPermission.value = true;
      break;
    }
  }
}

async function onFormSubmit(formData: RoleFormModel) {
  const { id, concurrencyStamp, name, isDefault, isPublic } = formData;
  const payload = { isDefault: !!isDefault, isPublic: !!isPublic, name };

  drawerApi.setState({ confirmLoading: true });
  try {
    await (id
      ? editRole(id, { ...payload, concurrencyStamp })
      : createRole(payload));
    message.success('Thao tác thành công');
    drawerApi.close();
    gridApi.query();
  } catch {
    // handled by request interceptor
  } finally {
    drawerApi.setState({ confirmLoading: false });
  }
}
</script>

<template>
  <Page>
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" @click="openCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          Thêm mới
        </NButton>
      </template>

      <!-- Boolean slots -->
      <template #boolDefault="{ row }">
        <NSwitch :value="row.isDefault" :disabled="true" size="small" />
      </template>
      <template #boolStatic="{ row }">
        <NSwitch :value="row.isStatic" :disabled="true" size="small" />
      </template>
      <template #boolPublic="{ row }">
        <NSwitch :value="row.isPublic" :disabled="true" size="small" />
      </template>

      <!-- Actions dropdown -->
      <template #actions="{ row }">
        <NDropdown
          :options="dropdownOptions"
          trigger="click"
          @select="(key) => handleMenu(row, key)"
        >
          <NButton quaternary circle size="small">
            <template #icon>
              <IconifyIcon class="size-4" icon="lucide:settings" />
            </template>
          </NButton>
        </NDropdown>
      </template>
    </Grid>

    <Drawer @submit="onFormSubmit" />

    <Permission
      v-model="showPermission"
      :provider-name="permissionProviderName"
      :provider-key="permissionProviderKey"
      :title="permissionTitle"
    />
  </Page>
</template>
