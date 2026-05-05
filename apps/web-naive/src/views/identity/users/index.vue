<script lang="ts" setup>
import type { VbenFormProps } from "#/adapter/form";
import type { VxeGridProps } from "#/adapter/vxe-table";
import type { IdentityUserApi } from "#/api";

import { ref } from "vue";

import { Page, useVbenDrawer, useVbenModal } from "@vben/common-ui";
import { IconifyIcon } from "@vben/icons";
import { formatDateTime } from "@vben/utils";

import { NButton, NDropdown, NTag } from "naive-ui";

import { message } from "#/adapter/naive";
import { useVbenVxeGrid } from "#/adapter/vxe-table";
import { getIdentityUsers } from "#/api";
import Permission from "#/components/Permission.vue";

import SetPasswordModal from "./SetPasswordModal.vue";
import UserForm from "./UserForm.vue";

type DropdownKey = "delete" | "edit" | "lock" | "loginAs" | "permission" | "setPassword";

type GridPage = {
  currentPage?: number;
  pageSize?: number;
};

const dropdownOptions: Array<{ key: DropdownKey; label: string }> = [
  { key: "edit", label: "Sửa" },
  { key: "permission", label: "Quyền" },
  { key: "setPassword", label: "Đặt mật khẩu" },
  { key: "lock", label: "Khóa" },
  { key: "loginAs", label: "Đăng nhập với user này" },
  { key: "delete", label: "Xóa" },
];

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: "Input",
      componentProps: {
        placeholder: "Nhập tên đăng nhập, họ tên hoặc email",
      },
      fieldName: "keyword",
      label: "Từ khóa",
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: "Tìm kiếm" },
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<IdentityUserApi.UserItem> = {
  border: "full",
  columns: [
    {
      align: "center",
      fixed: "left",
      slots: { default: "actions" },
      title: "Hành động",
      width: 100,
    },
    {
      align: "center",
      title: "#",
      type: "seq",
      width: 60,
    },
    {
      field: "userName",
      title: "Tên đăng nhập",
      width: 160,
    },
    {
      field: "name",
      minWidth: 160,
      title: "Họ tên",
    },
    {
      field: "email",
      title: "Email",
      width: 220,
    },
    {
      field: "phoneNumber",
      title: "Số điện thoại",
      width: 160,
    },
    {
      field: "isActive",
      slots: { default: "activeTag" },
      title: "Hoạt động",
      width: 120,
    },
    {
      field: "lockoutEnabled",
      slots: { default: "lockedTag" },
      title: "Khóa",
      width: 120,
    },
    {
      field: "accessFailedCount",
      title: "Số lần lỗi",
      width: 140,
    },
    {
      field: "creationTime",
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        cellValue ? formatDateTime(cellValue) : "-",
      title: "Ngày tạo",
      width: 200,
    },
    {
      field: "lastModificationTime",
      formatter: ({ cellValue }: { cellValue?: null | string }) =>
        cellValue ? formatDateTime(cellValue) : "-",
      title: "Ngày chỉnh sửa",
      width: 200,
    },
  ],
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }: { page: GridPage }, formValues?: Record<string, unknown>) => {
        const current = page.currentPage ?? 1;
        const pageSize = page.pageSize ?? 10;
        const keyword = typeof formValues?.keyword === "string" ? formValues.keyword.trim() : "";
        const response = await getIdentityUsers({
          filter: keyword || undefined,
          maxResultCount: pageSize,
          skipCount: (current - 1) * pageSize,
        });
        const items = response.items ?? [];

        return {
          items,
          total: response.totalCount ?? items.length,
        };
      },
    },
  },
  round: true,
  showOverflow: true,
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: true,
    // @ts-ignore search is an extended Vben toolbar config option.
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid<IdentityUserApi.UserItem>({
  formOptions,
  gridOptions,
});

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: UserForm,
});

const [PasswordModal, passwordModalApi] = useVbenModal({
  connectedComponent: SetPasswordModal,
});

const showPermission = ref(false);
const permissionProviderName = ref("U");
const permissionProviderKey = ref("");
const permissionTitle = ref("");

function openCreate() {
  drawerApi.setData({ record: null });
  drawerApi.open();
}

function onEdit(row: IdentityUserApi.UserItem) {
  drawerApi.setData({ record: row });
  drawerApi.open();
}

function onDelete(row: IdentityUserApi.UserItem) {
  message.info(`Chưa có API xóa người dùng: ${row.userName ?? ""}`);
}

function handleMenu(row: IdentityUserApi.UserItem, key: string | number) {
  const menuKey = String(key) as DropdownKey;

  switch (menuKey) {
    case "delete": {
      onDelete(row);
      break;
    }
    case "edit": {
      onEdit(row);
      break;
    }
    case "lock": {
      message.info(`Chưa có API khóa người dùng: ${row.userName ?? ""}`);
      break;
    }
    case "loginAs": {
      message.info(`Chưa có API đăng nhập với user: ${row.userName ?? ""}`);
      break;
    }
    case "permission": {
      permissionProviderName.value = "U";
      permissionProviderKey.value = String(row.id);
      permissionTitle.value = `Quyền của ${row.userName ?? ""}`;
      showPermission.value = true;
      break;
    }
    case "setPassword": {
      passwordModalApi.setData({ record: row });
      passwordModalApi.setState({
        title: `Đặt mật khẩu - ${row.userName ?? ""}`,
      });
      passwordModalApi.open();
      break;
    }
  }
}

async function onFormSubmit() {
  message.success("Thao tác thành công");
  drawerApi.close();
  await gridApi.query();
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

      <template #activeTag="{ row }">
        <NTag :bordered="false" :type="row.isActive ? 'success' : 'error'">
          {{ row.isActive ? "Hoạt động" : "Không hoạt động" }}
        </NTag>
      </template>

      <template #lockedTag="{ row }">
        <NTag :bordered="false" :type="row.lockoutEnabled ? 'error' : 'success'">
          {{ row.lockoutEnabled ? "Đã khóa" : "Không khóa" }}
        </NTag>
      </template>

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
    <PasswordModal />

    <Permission
      v-model="showPermission"
      :provider-name="permissionProviderName"
      :provider-key="permissionProviderKey"
      :title="permissionTitle"
    />
  </Page>
</template>
