<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import {
  NButton,
  NCheckbox,
  NDrawer,
  NDrawerContent,
  NInput,
  NSpin,
  useMessage,
} from 'naive-ui';

import { requestClient } from '#/api/request';

type ApiPermission = {
  displayName: string;
  grantedProviders?: Array<{ providerKey: string; providerName: string }>;
  isGranted: boolean;
  name: string;
  parentName: null | string;
};

type ApiGroup = {
  displayName: string;
  name: string;
  permissions: ApiPermission[];
};

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    providerKey?: string;
    providerName?: string;
    title?: string;
  }>(),
  {
    modelValue: false,
    providerKey: '',
    providerName: '',
    title: 'Quyền',
  },
);

const emit = defineEmits<{
  save: [payload: { granted: string[] }];
  'update:modelValue': [value: boolean];
}>();

const message = useMessage();

const visible = computed({
  get: () => !!props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

// Responsive drawer width
const drawerWidth = ref(600);
function updateDrawerWidth() {
  try {
    drawerWidth.value = window.innerWidth <= 640 ? window.innerWidth : 600;
  } catch {
    drawerWidth.value = 600;
  }
}
onMounted(() => {
  updateDrawerWidth();
  window.addEventListener('resize', updateDrawerWidth);
});
onUnmounted(() => {
  window.removeEventListener('resize', updateDrawerWidth);
});

const filter = ref('');
const groups = ref<ApiGroup[]>([]);
const selectedGroup = ref<string>('');
const checked = ref<Record<string, boolean>>({});
const initialChecked = ref<Record<string, boolean>>({});
const loading = ref(false);

const currentGroup = computed(
  () => groups.value.find((g) => g.name === selectedGroup.value) ?? null,
);
const currentPermissions = computed(
  () => currentGroup.value?.permissions ?? [],
);

const filteredPermissions = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return currentPermissions.value;
  return currentPermissions.value.filter((p) =>
    p.displayName.toLowerCase().includes(q),
  );
});

function isPermissionEditable(p: ApiPermission) {
  const provider = (props.providerName ?? '').toString();
  if (!provider) return false;
  if (provider === 'R') return true;
  if (provider === 'U') {
    const gps = p.grantedProviders ?? [];
    if (gps.length === 0) return true;
    return gps.some((g) => g.providerName === 'U');
  }
  return true;
}

const anyEditablePermissions = computed(() =>
  groups.value
    .flatMap((g) => g.permissions)
    .some((p) => isPermissionEditable(p)),
);

const currentEditableCount = computed(
  () => currentPermissions.value.filter((p) => isPermissionEditable(p)).length,
);

const groupAllChecked = computed({
  get: () => {
    const perms = currentPermissions.value.filter((p) =>
      isPermissionEditable(p),
    );
    return perms.length > 0 && perms.every((p) => checked.value[p.name]);
  },
  set: (v: boolean) => {
    const g = groups.value.find((x) => x.name === selectedGroup.value);
    if (!g) return;
    g.permissions.forEach((p) => {
      if (isPermissionEditable(p)) checked.value[p.name] = v;
    });
  },
});

const grantAll = computed({
  get() {
    const editable = Object.keys(checked.value).filter((k) => {
      const perm = groups.value
        .flatMap((g) => g.permissions)
        .find((p) => p.name === k);
      return perm ? isPermissionEditable(perm) : false;
    });
    return editable.length > 0 && editable.every((k) => checked.value[k]);
  },
  set(v: boolean) {
    Object.keys(checked.value).forEach((k) => {
      const p = groups.value
        .flatMap((g) => g.permissions)
        .find((perm) => perm.name === k);
      if (p ? isPermissionEditable(p) : false) {
        checked.value[k] = v;
      }
    });
  },
});

async function fetchPermissions(providerName: string, providerKey: string) {
  if (!providerName || !providerKey) return;
  loading.value = true;
  try {
    const res = await requestClient.get<any>(
      `/api/permission-management/permissions?providerName=${encodeURIComponent(providerName)}&providerKey=${encodeURIComponent(providerKey)}`,
      { responseReturn: 'body' },
    );

    const body = res ?? {};
    const apiGroups: ApiGroup[] = (body.groups ?? []).map((g: any) => ({
      displayName: g.displayName,
      name: g.name,
      permissions: (g.permissions ?? []).map((p: any) => ({
        displayName: p.displayName,
        grantedProviders: p.grantedProviders ?? [],
        isGranted: !!p.isGranted,
        name: p.name,
        parentName: p.parentName,
      })),
    }));

    groups.value = apiGroups;
    selectedGroup.value = apiGroups[0]?.name ?? '';

    const map: Record<string, boolean> = {};
    apiGroups.forEach((g) =>
      g.permissions.forEach((p) => {
        map[p.name] = p.isGranted;
      }),
    );
    checked.value = map;
    initialChecked.value = { ...map };
  } catch (error: any) {
    message.error(error?.message ?? 'Tải quyền thất bại');
  } finally {
    loading.value = false;
  }
}

watch(
  () => visible.value,
  (v) => {
    if (v && props.providerName && props.providerKey) {
      fetchPermissions(props.providerName, props.providerKey);
    }
  },
);

function close() {
  visible.value = false;
}

async function onSave() {
  const changed = Object.keys(checked.value).filter(
    (k) => (initialChecked.value[k] ?? false) !== checked.value[k],
  );

  if (changed.length === 0) {
    message.info('Không có thay đổi quyền nào');
    emit('save', { granted: [] });
    visible.value = false;
    return;
  }

  const perms = changed.map((name) => ({
    isGranted: !!checked.value[name],
    name,
  }));
  loading.value = true;
  try {
    const url = `/api/permission-management/permissions?providerName=${encodeURIComponent(String(props.providerName))}&providerKey=${encodeURIComponent(String(props.providerKey))}`;
    await requestClient.put(
      url,
      { permissions: perms },
      { responseReturn: 'body' },
    );
    message.success('Lưu quyền thành công');
    emit('save', { granted: changed });
    visible.value = false;
  } catch (error: any) {
    message.error(error?.message ?? 'Lưu quyền thất bại');
  } finally {
    loading.value = false;
  }
}

function onPermissionToggle(p: ApiPermission, v: boolean) {
  checked.value[p.name] = v;
  if (v && p.parentName) {
    const parent = groups.value
      .flatMap((g) => g.permissions)
      .find((perm) => perm.name === p.parentName);
    if (parent && isPermissionEditable(parent)) {
      checked.value[parent.name] = true;
    }
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="drawerWidth" placement="left">
    <NDrawerContent :title="props.title || 'Quyền'" closable>
      <NSpin :show="loading">
        <!-- Filter + Grant All -->
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <NInput
            v-model:value="filter"
            placeholder="Lọc quyền..."
            clearable
            class="flex-1"
          />
          <div class="flex items-center gap-2 whitespace-nowrap">
            <NCheckbox
              v-model:checked="grantAll"
              :disabled="!anyEditablePermissions"
            />
            <span class="text-sm">Cấp tất cả quyền</span>
          </div>
        </div>

        <!-- Content -->
        <div class="flex flex-col gap-4 rounded-lg border p-4 md:flex-row">
          <!-- Left: Group list -->
          <div class="w-full shrink-0 md:w-52">
            <div class="max-h-60 overflow-auto pr-1 md:max-h-[420px]">
              <div class="flex flex-col gap-1">
                <NButton
                  v-for="g in groups"
                  :key="g.name"
                  :type="selectedGroup === g.name ? 'primary' : 'default'"
                  size="small"
                  class="w-full justify-start"
                  @click="selectedGroup = g.name"
                >
                  {{ g.displayName }}
                </NButton>
              </div>
            </div>
          </div>

          <!-- Right: Permission list -->
          <div
            class="min-w-0 flex-1 border-t pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0"
          >
            <!-- Select all in group -->
            <div class="mb-3 flex items-center gap-2">
              <NCheckbox
                v-model:checked="groupAllChecked"
                :disabled="currentEditableCount === 0"
              />
              <span class="text-sm font-medium">Chọn tất cả</span>
            </div>

            <!-- Permission items -->
            <div class="max-h-64 overflow-auto lg:max-h-[400px]">
              <div
                v-for="perm in filteredPermissions"
                :key="perm.name"
                class="flex items-center gap-2 py-1.5"
                :class="perm.parentName ? 'pl-5' : ''"
              >
                <NCheckbox
                  :checked="checked[perm.name]"
                  :disabled="!isPermissionEditable(perm)"
                  @update:checked="(v) => onPermissionToggle(perm, !!v)"
                />
                <span
                  class="text-sm"
                  :class="perm.parentName ? 'text-gray-500' : 'font-semibold'"
                >
                  {{ perm.displayName }}
                </span>
              </div>

              <div
                v-if="filteredPermissions.length === 0"
                class="py-4 text-center text-sm text-gray-400"
              >
                Không tìm thấy quyền nào
              </div>
            </div>
          </div>
        </div>
      </NSpin>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="close">Hủy</NButton>
          <NButton type="primary" :loading="loading" @click="onSave"
            >Lưu</NButton
          >
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
