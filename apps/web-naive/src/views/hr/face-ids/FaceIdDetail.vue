<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { FaceAttendanceApi } from '#/models/hr/face-attendance';

import { computed, h, onBeforeUnmount, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { formatDate } from '@vben/utils';

import {
  NButton,
  NCheckbox,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NImage,
  NPopconfirm,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  deleteEmployeeFaceApi,
  enrollFaceForEmployeeApi,
  getFaceEmployeeDetailApi,
} from '#/api';
import { FACE_ATTENDANCE_PERMISSIONS } from '#/constants/face-attendance';
import {
  FACE_ATTEMPT_RESULTS,
  FACE_ATTEMPT_TYPES,
} from '#/models/hr/face-attendance';
import {
  FACE_SOURCE_MAX_BYTES,
  resizeFaceImageFile,
} from '#/utils/face-image';

const emit = defineEmits<{ changed: [] }>();

const { hasAccessByCodes } = useAccess();
const canDelete = computed(() =>
  hasAccessByCodes([FACE_ATTENDANCE_PERMISSIONS.delete]),
);
const canEnroll = computed(() =>
  hasAccessByCodes([FACE_ATTENDANCE_PERMISSIONS.enroll]),
);

const employeeId = ref<null | number>(null);
const detail = ref<FaceAttendanceApi.EmployeeFaceDetail | null>(null);
const loading = ref(false);
const deleting = ref(false);
const enrolling = ref(false);
const processing = ref(false);
const consent = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const enrollBlob = ref<Blob | null>(null);
const enrollPreview = ref('');
let loadSequence = 0;

function t(key: string, args?: string[]) {
  const fullKey = `page.hr.faceIdPage.${key}`;
  return args ? $t(fullKey, args) : $t(fullKey);
}

function formatDateTime(value?: null | string) {
  return value ? formatDate(value, 'DD-MM-YYYY HH:mm:ss') : '-';
}

function resultCode(value: FaceAttendanceApi.AttemptResult) {
  return FACE_ATTEMPT_RESULTS[value] ?? String(value);
}

function resultTagType(value: FaceAttendanceApi.AttemptResult) {
  const code = resultCode(value);
  if (code === 'Enrolled' || code === 'Verified') return 'success';
  if (code === 'NotMatch' || code === 'Duplicate') return 'error';
  return 'warning';
}

const title = computed(() =>
  detail.value
    ? `${t('detailTitle')} - ${detail.value.employeeName ?? ''}`
    : t('detailTitle'),
);

const attemptColumns = computed<DataTableColumns<FaceAttendanceApi.AttemptItem>>(
  () => [
    {
      key: 'imageUrl',
      render: (row) =>
        row.imageUrl
          ? h(NImage, {
              height: 48,
              objectFit: 'cover',
              src: row.imageUrl,
              width: 36,
            })
          : '-',
      title: t('columns.image'),
      width: 60,
    },
    {
      key: 'creationTime',
      render: (row) => formatDateTime(row.creationTime),
      title: t('columns.time'),
      width: 160,
    },
    {
      key: 'type',
      render: (row) =>
        t(`types.${FACE_ATTEMPT_TYPES[row.type] ?? 'Verify'}`),
      title: t('columns.type'),
      width: 100,
    },
    {
      key: 'result',
      render: (row) =>
        h(
          NTag,
          { bordered: false, size: 'small', type: resultTagType(row.result) },
          () => t(`results.${resultCode(row.result)}`),
        ),
      title: t('columns.result'),
      width: 140,
    },
    {
      key: 'scorePercent',
      render: (row) =>
        row.scorePercent == null
          ? '-'
          : `${row.scorePercent}% (${row.score?.toFixed(3) ?? '-'})`,
      title: t('columns.score'),
      width: 130,
    },
    {
      ellipsis: { tooltip: true },
      key: 'deviceId',
      render: (row) => row.deviceId ?? '-',
      title: t('columns.device'),
    },
  ],
);

async function loadDetail() {
  const id = employeeId.value;
  if (id === null) return;
  const sequence = ++loadSequence;
  loading.value = true;
  try {
    const result = await getFaceEmployeeDetailApi(id);
    if (sequence === loadSequence) detail.value = result.data ?? null;
  } catch {
    // Interceptor đã hiển thị lỗi.
  } finally {
    if (sequence === loadSequence) loading.value = false;
  }
}

async function handleDelete() {
  const id = employeeId.value;
  if (id === null || deleting.value) return;
  deleting.value = true;
  try {
    await deleteEmployeeFaceApi(id);
    message.success(t('deleteSuccess'));
    emit('changed');
    await loadDetail();
  } catch {
    // Interceptor đã hiển thị lỗi.
  } finally {
    deleting.value = false;
  }
}

function clearEnrollSelection() {
  if (enrollPreview.value) URL.revokeObjectURL(enrollPreview.value);
  enrollPreview.value = '';
  enrollBlob.value = null;
  consent.value = false;
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    message.error($t('page.hr.attendancePage.faceCheckIn.invalidImage'));
    return;
  }
  if (file.size > FACE_SOURCE_MAX_BYTES) {
    message.error($t('page.hr.attendancePage.faceCheckIn.imageTooLarge'));
    return;
  }
  processing.value = true;
  try {
    const blob = await resizeFaceImageFile(file);
    clearEnrollSelection();
    enrollBlob.value = blob;
    enrollPreview.value = URL.createObjectURL(blob);
  } catch {
    message.error($t('page.hr.attendancePage.faceCheckIn.invalidImage'));
  } finally {
    processing.value = false;
  }
}

async function handleEnroll() {
  const id = employeeId.value;
  const blob = enrollBlob.value;
  if (id === null || !blob || enrolling.value) return;
  if (!consent.value) {
    message.warning(t('enroll.consentRequired'));
    return;
  }
  enrolling.value = true;
  try {
    const result = await enrollFaceForEmployeeApi(id, {
      consent: true,
      image: blob,
    });
    message.success(result.message || t('enroll.success'));
    clearEnrollSelection();
    if (result.data) detail.value = result.data;
    emit('changed');
  } catch {
    // Interceptor đã hiển thị lỗi (ví dụ "FaceID đã tồn tại").
  } finally {
    enrolling.value = false;
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      loadSequence += 1;
      detail.value = null;
      employeeId.value = null;
      clearEnrollSelection();
      return;
    }
    const data = drawerApi.getData<{ employeeId: number }>();
    employeeId.value = data?.employeeId ?? null;
    void loadDetail();
  },
});

onBeforeUnmount(() => {
  loadSequence += 1;
  clearEnrollSelection();
});

defineExpose({ drawerApi });
</script>

<template>
  <Drawer :title="title" class="w-full md:w-[760px]">
    <NSpin :show="loading">
      <div v-if="detail" class="face-detail">
        <div class="face-detail__top">
          <div class="face-detail__photo">
            <NImage
              v-if="detail.imageUrl"
              :src="detail.imageUrl"
              :alt="t('columns.image')"
              object-fit="cover"
              width="180"
              height="240"
            />
            <div v-else class="face-detail__placeholder">
              <IconifyIcon icon="lucide:scan-face" class="size-12" />
              <span>{{ detail.enrolled ? t('noImage') : t('notEnrolled') }}</span>
            </div>
          </div>

          <NDescriptions
            :column="1"
            label-placement="left"
            size="small"
            class="face-detail__info"
          >
            <NDescriptionsItem :label="t('columns.employeeCode')">
              {{ detail.employeeCode ?? '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('columns.employeeName')">
              {{ detail.employeeName ?? '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('columns.userName')">
              {{ detail.userName ?? '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('columns.status')">
              <NTag
                :bordered="false"
                size="small"
                :type="detail.enrolled ? 'success' : 'default'"
              >
                {{ detail.enrolled ? t('enrolled') : t('notEnrolled') }}
              </NTag>
            </NDescriptionsItem>
            <template v-if="detail.enrolled">
              <NDescriptionsItem :label="t('columns.enrolledAt')">
                {{ formatDateTime(detail.enrolledAt) }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="t('columns.enrolledBy')">
                {{ detail.selfEnrolled ? t('selfEnrolled') : t('hrEnrolled') }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="t('consent')">
                {{ detail.consentAccepted ? t('yes') : t('no') }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="t('model')">
                {{ detail.modelName ?? '-' }}
                <span v-if="detail.detScore != null">
                  ({{ t('detScore') }}: {{ detail.detScore.toFixed(3) }})
                </span>
              </NDescriptionsItem>
            </template>
            <NDescriptionsItem :label="t('columns.lastCheckIn')">
              {{ formatDateTime(detail.lastCheckInTime) }}
            </NDescriptionsItem>
          </NDescriptions>
        </div>

        <div class="face-detail__actions">
          <NPopconfirm
            v-if="detail.enrolled"
            :negative-text="t('cancel')"
            :positive-text="t('delete')"
            :positive-button-props="{ loading: deleting }"
            @positive-click="handleDelete"
          >
            <template #trigger>
              <NButton
                type="error"
                ghost
                :disabled="!canDelete || deleting"
                :loading="deleting"
              >
                <template #icon><IconifyIcon icon="lucide:trash-2" /></template>
                {{ t('delete') }}
              </NButton>
            </template>
            {{ t('deleteConfirm', [detail.employeeName ?? '']) }}
          </NPopconfirm>
        </div>

        <!-- HR đăng ký / thay FaceID hộ -->
        <div v-if="canEnroll" class="face-detail__enroll">
          <div class="face-detail__section-title">
            {{ detail.enrolled ? t('enroll.replaceTitle') : t('enroll.title') }}
          </div>
          <p class="face-detail__hint">{{ t('enroll.hint') }}</p>
          <div class="face-detail__enroll-body">
            <img
              v-if="enrollPreview"
              :src="enrollPreview"
              :alt="t('columns.image')"
              class="face-detail__enroll-preview"
            />
            <div class="face-detail__enroll-controls">
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                :aria-label="t('enroll.choose')"
                @change="handleFileChange"
              />
              <NButton
                :loading="processing"
                :disabled="enrolling"
                @click="fileInput?.click()"
              >
                <template #icon><IconifyIcon icon="lucide:image-up" /></template>
                {{ enrollBlob ? t('enroll.chooseAnother') : t('enroll.choose') }}
              </NButton>
              <NCheckbox v-if="enrollBlob" v-model:checked="consent">
                {{ t('enroll.consent') }}
              </NCheckbox>
              <NButton
                v-if="enrollBlob"
                type="primary"
                :disabled="!consent"
                :loading="enrolling"
                @click="handleEnroll"
              >
                {{ t('enroll.submit') }}
              </NButton>
            </div>
          </div>
        </div>

        <div class="face-detail__section-title">{{ t('recentAttempts') }}</div>
        <NDataTable
          v-if="detail.recentAttempts.length > 0"
          :columns="attemptColumns"
          :data="detail.recentAttempts"
          :row-key="(row: FaceAttendanceApi.AttemptItem) => row.id"
          :scroll-x="680"
          size="small"
        />
        <NEmpty v-else :description="t('noAttempts')" />
      </div>
    </NSpin>
  </Drawer>
</template>

<style scoped>
.face-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.face-detail__top {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.face-detail__photo {
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 12px;
}

.face-detail__placeholder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 240px;
  font-size: 13px;
  border: 1px dashed hsl(var(--border));
  border-radius: 12px;
  opacity: 0.7;
}

.face-detail__info {
  flex: 1;
  min-width: 240px;
}

.face-detail__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.face-detail__enroll {
  padding: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
}

.face-detail__section-title {
  font-weight: 700;
}

.face-detail__hint {
  margin: 4px 0 12px;
  font-size: 13px;
  opacity: 0.7;
}

.face-detail__enroll-body {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.face-detail__enroll-preview {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 8px;
}

.face-detail__enroll-controls {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  min-width: 200px;
}
</style>
