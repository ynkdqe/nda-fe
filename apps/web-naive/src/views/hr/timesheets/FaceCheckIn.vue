<script lang="ts" setup>
import type { DropdownOption } from 'naive-ui';

import type { FaceAttendanceApi } from '#/models/hr/face-attendance';

import { computed, h, nextTick, onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  NButton,
  NCard,
  NCheckbox,
  NDropdown,
  NProgress,
  NResult,
  NSpin,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { faceCheckInApi, getFaceAttendanceStatusApi } from '#/api';
import {
  captureFaceFromVideo,
  FACE_SOURCE_MAX_BYTES,
  getFaceDeviceId,
  resizeFaceImageFile,
} from '#/utils/face-image';

const emit = defineEmits<{ checkedIn: [] }>();

type Source = 'camera' | 'upload';
type Mode = 'camera' | 'preview' | 'result';

interface CheckInOutcome {
  data: FaceAttendanceApi.CheckInResult | null;
  message: string;
  success: boolean;
}

const fileInput = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const source = ref<Source>('camera');
const mode = ref<Mode>('camera');
const isOpen = ref(false);
const cameraReady = ref(false);
const cameraStarting = ref(false);
const cameraError = ref('');
const processing = ref(false);
const submitting = ref(false);
const consent = ref(false);
const imageBlob = ref<Blob | null>(null);
const previewUrl = ref('');
const outcome = ref<CheckInOutcome | null>(null);
const status = ref<FaceAttendanceApi.Status | null>(null);
const statusLoading = ref(false);
const lastCheckInTime = ref<null | string>(null);

let stream: MediaStream | null = null;
let disposed = false;

function t(key: string, args?: string[]) {
  const fullKey = `page.hr.attendancePage.faceCheckIn.${key}`;
  return args ? $t(fullKey, args) : $t(fullKey);
}

const sourceOptions = computed<DropdownOption[]>(() => [
  {
    icon: () => h(IconifyIcon, { icon: 'lucide:camera' }),
    key: 'camera',
    label: t('fromCamera'),
  },
  {
    icon: () => h(IconifyIcon, { icon: 'lucide:image-up' }),
    key: 'upload',
    label: t('fromDevice'),
  },
]);

/** Lần đầu (chưa đăng ký) phải đồng ý xử lý dữ liệu khuôn mặt. */
const needsConsent = computed(() => status.value?.enrolled === false);
const canSubmit = computed(
  () =>
    Boolean(imageBlob.value) &&
    !submitting.value &&
    !processing.value &&
    (!needsConsent.value || consent.value),
);

function formatTime(value?: null | string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const lastCheckInLabel = computed(() => {
  const value = lastCheckInTime.value ?? status.value?.lastCheckInTime;
  return value ? t('lastCheckIn', [formatTime(value)]) : '';
});

// ---------------- Camera ----------------

function stopCamera() {
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }
  if (videoRef.value) videoRef.value.srcObject = null;
  cameraReady.value = false;
  cameraStarting.value = false;
}

function cameraErrorMessage(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return t('cameraDenied');
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return t('cameraNotFound');
  }
  return t('cameraUnsupported');
}

async function startCamera() {
  stopCamera();
  cameraError.value = '';
  // getUserMedia chỉ có trong secure context (HTTPS hoặc localhost)
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = t('cameraUnsupported');
    return;
  }
  cameraStarting.value = true;
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        height: { ideal: 720 },
        width: { ideal: 1280 },
      },
    });
    if (disposed || !isOpen.value || mode.value !== 'camera') {
      for (const track of media.getTracks()) track.stop();
      return;
    }
    stream = media;
    await nextTick();
    const video = videoRef.value;
    if (!video) return;
    video.srcObject = media;
    await video.play();
    cameraReady.value = true;
  } catch (error) {
    stopCamera();
    cameraError.value = cameraErrorMessage(error);
  } finally {
    cameraStarting.value = false;
  }
}

async function capture() {
  const video = videoRef.value;
  if (!video || !cameraReady.value || processing.value) return;
  processing.value = true;
  try {
    const blob = await captureFaceFromVideo(video);
    stopCamera();
    setPreview(blob);
    mode.value = 'preview';
  } catch {
    message.error(t('invalidImage'));
  } finally {
    processing.value = false;
  }
}

// ---------------- Upload từ thiết bị ----------------

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || disposed) return;

  if (!file.type.startsWith('image/')) {
    message.error(t('invalidImage'));
    return;
  }
  if (file.size > FACE_SOURCE_MAX_BYTES) {
    message.error(t('imageTooLarge'));
    return;
  }

  processing.value = true;
  try {
    const blob = await resizeFaceImageFile(file);
    if (disposed) return;
    source.value = 'upload';
    setPreview(blob);
    mode.value = 'preview';
    outcome.value = null;
    if (!isOpen.value) modalApi.open();
  } catch {
    message.error(t('invalidImage'));
  } finally {
    processing.value = false;
  }
}

// ---------------- Preview / submit ----------------

function setPreview(blob: Blob | null) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  imageBlob.value = blob;
  previewUrl.value = blob ? URL.createObjectURL(blob) : '';
}

async function loadStatus() {
  if (statusLoading.value) return;
  statusLoading.value = true;
  try {
    const result = await getFaceAttendanceStatusApi();
    if (!disposed) status.value = result.data ?? null;
  } catch {
    // Interceptor đã hiển thị lỗi (ví dụ tài khoản chưa liên kết nhân viên).
  } finally {
    statusLoading.value = false;
  }
}

async function submit() {
  const blob = imageBlob.value;
  if (!blob || submitting.value) return;
  if (needsConsent.value && !consent.value) {
    message.warning(t('consentRequired'));
    return;
  }

  submitting.value = true;
  modalApi.lock();
  try {
    const result = await faceCheckInApi({
      appVersion: 'web',
      consent: consent.value,
      deviceId: getFaceDeviceId(),
      image: blob,
    });
    if (disposed) return;
    const data = result.data ?? null;
    outcome.value = {
      data,
      message: result.message || t('successVerified'),
      success: true,
    };
    if (status.value) status.value.enrolled = true;
    lastCheckInTime.value = data?.eventTime ?? new Date().toISOString();
    message.success(
      data?.action === 'ENROLLED' ? t('successEnrolled') : t('successVerified'),
    );
    emit('checkedIn');
  } catch (error) {
    // Interceptor đã hiện message lỗi; giữ lại kết quả để hiển thị chi tiết trong modal.
    const body = (
      error as { response?: { data?: FaceAttendanceApi.CheckInResponse } }
    )?.response?.data;
    outcome.value = {
      data: body?.data ?? null,
      message: body?.message || (error as Error)?.message || t('failed'),
      success: false,
    };
  } finally {
    submitting.value = false;
    modalApi.unlock();
    if (!disposed) mode.value = 'result';
  }
}

function retry() {
  outcome.value = null;
  if (source.value === 'camera') {
    setPreview(null);
    mode.value = 'camera';
    void startCamera();
  } else {
    // Giữ ảnh cũ cho tới khi user chọn ảnh mới (có thể huỷ hộp chọn file)
    mode.value = 'preview';
    fileInput.value?.click();
  }
}

// ---------------- Modal ----------------

function resetState() {
  stopCamera();
  setPreview(null);
  outcome.value = null;
  cameraError.value = '';
  consent.value = false;
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onBeforeClose: () => !submitting.value,
  onOpenChange(open) {
    isOpen.value = open;
    if (!open) {
      resetState();
      return;
    }
    void loadStatus();
    if (mode.value === 'camera') void startCamera();
  },
});

function handleSelect(key: number | string) {
  if (key === 'camera') {
    resetState();
    source.value = 'camera';
    mode.value = 'camera';
    // onOpenChange(true) sẽ mở camera
    modalApi.open();
    return;
  }
  // Mở hộp chọn file ngay trong user gesture
  fileInput.value?.click();
}

const resultTitle = computed(() => {
  const value = outcome.value;
  if (!value) return '';
  if (!value.success) return t('failed');
  if (value.data?.isDuplicateRequest) return t('duplicateRequest');
  return value.data?.action === 'ENROLLED'
    ? t('successEnrolled')
    : t('successVerified');
});

onBeforeUnmount(() => {
  disposed = true;
  stopCamera();
  setPreview(null);
});
</script>

<template>
  <NCard :bordered="false" class="face-check-in">
    <div class="face-check-in__bar">
      <div class="face-check-in__info">
        <div class="face-check-in__title">{{ t('title') }}</div>
        <div class="face-check-in__subtitle">
          {{ lastCheckInLabel || t('subtitle') }}
        </div>
      </div>
      <NDropdown
        trigger="click"
        :options="sourceOptions"
        @select="handleSelect"
      >
        <NButton
          type="primary"
          size="large"
          :loading="processing && !isOpen"
          :disabled="submitting"
        >
          <template #icon>
            <IconifyIcon icon="lucide:scan-face" />
          </template>
          {{ t('button') }}
        </NButton>
      </NDropdown>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      :aria-label="t('fromDevice')"
      @change="handleFileChange"
    />
  </NCard>

  <Modal
    :title="t('title')"
    :closable="!submitting"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    class="w-[95vw] md:w-[480px]"
  >
    <NSpin :show="processing || statusLoading">
      <!-- Camera -->
      <div v-if="mode === 'camera'" class="face-check-in__stage">
        <div v-if="cameraError" class="face-check-in__error" role="alert">
          <IconifyIcon icon="lucide:camera-off" class="size-10" />
          <p>{{ cameraError }}</p>
          <NButton size="small" @click="startCamera">{{ t('retry') }}</NButton>
        </div>
        <template v-else>
          <video
            ref="videoRef"
            autoplay
            muted
            playsinline
            class="face-check-in__video"
          ></video>
          <div class="face-check-in__guide" aria-hidden="true"></div>
          <div v-if="cameraStarting" class="face-check-in__overlay-text">
            {{ t('startingCamera') }}
          </div>
        </template>
      </div>

      <!-- Preview -->
      <div v-else-if="mode === 'preview'" class="face-check-in__stage">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="t('previewAlt')"
          class="face-check-in__image"
        />
      </div>

      <!-- Result -->
      <NResult
        v-else-if="outcome"
        :status="outcome.success ? 'success' : 'error'"
        :title="resultTitle"
        :description="outcome.success ? undefined : outcome.message"
        size="small"
      >
        <template
          v-if="outcome.data?.eventTime || outcome.data?.scorePercent != null"
          #footer
        >
          <div class="face-check-in__result">
            <div v-if="outcome.data?.eventTime">
              {{ t('time') }}: <b>{{ formatTime(outcome.data.eventTime) }}</b>
            </div>
            <!-- Có cả khi không khớp (NotMatch) để user biết còn thiếu bao nhiêu -->
            <div
              v-if="outcome.data?.scorePercent != null"
              class="face-check-in__score"
            >
              <span>
                {{ t('score') }}:
                <b
                  :class="outcome.success ? 'text-success' : 'text-destructive'"
                >
                  {{ outcome.data.scorePercent }}%
                </b>
                <span class="face-check-in__pass">
                  ({{ t('passAt', [String(outcome.data.passPercent ?? 85)]) }})
                </span>
              </span>
              <NProgress
                type="line"
                :percentage="outcome.data.scorePercent"
                :status="outcome.success ? 'success' : 'error'"
                :show-indicator="false"
                class="w-56"
              />
            </div>
          </div>
        </template>
      </NResult>

      <p v-if="mode !== 'result'" class="face-check-in__hint">
        {{ t('hint') }}
      </p>
      <div
        v-if="mode === 'preview' && needsConsent"
        class="face-check-in__consent"
      >
        <p class="face-check-in__notice">{{ t('firstTimeNotice') }}</p>
        <NCheckbox v-model:checked="consent">{{ t('consent') }}</NCheckbox>
      </div>
    </NSpin>

    <template #footer>
      <div class="face-check-in__footer">
        <template v-if="mode === 'camera'">
          <NButton @click="modalApi.close()">{{ t('close') }}</NButton>
          <NButton
            type="primary"
            :disabled="!cameraReady || processing"
            @click="capture"
          >
            <template #icon><IconifyIcon icon="lucide:aperture" /></template>
            {{ t('capture') }}
          </NButton>
        </template>
        <template v-else-if="mode === 'preview'">
          <NButton :disabled="submitting" @click="retry">
            {{ source === 'camera' ? t('retake') : t('chooseAnother') }}
          </NButton>
          <NButton
            type="primary"
            :disabled="!canSubmit"
            :loading="submitting"
            @click="submit"
          >
            {{ t('submit') }}
          </NButton>
        </template>
        <template v-else>
          <NButton v-if="!outcome?.success" @click="retry">
            {{ t('retry') }}
          </NButton>
          <NButton type="primary" @click="modalApi.close()">
            {{ t('close') }}
          </NButton>
        </template>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.face-check-in__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.face-check-in__title {
  font-size: 16px;
  font-weight: 700;
}

.face-check-in__subtitle {
  margin-top: 2px;
  font-size: 13px;
  opacity: 0.65;
}

.face-check-in__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-height: 60vh;
  aspect-ratio: 3 / 4;
  margin: 0 auto;
  overflow: hidden;
  background: #000;
  border-radius: 12px;
}

.face-check-in__video,
.face-check-in__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Camera trước hiển thị kiểu gương cho tự nhiên; ảnh gửi lên không bị lật. */
.face-check-in__video {
  transform: scaleX(-1);
}

.face-check-in__guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 62%;
  aspect-ratio: 3 / 4;
  pointer-events: none;
  border: 3px dashed rgb(255 255 255 / 85%);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 35%);
  transform: translate(-50%, -50%);
}

.face-check-in__overlay-text {
  position: absolute;
  bottom: 12px;
  left: 50%;
  font-size: 13px;
  color: #fff;
  transform: translateX(-50%);
}

.face-check-in__error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 24px;
  color: #fff;
  text-align: center;
}

.face-check-in__hint {
  margin: 12px 0 0;
  font-size: 13px;
  text-align: center;
  opacity: 0.7;
}

.face-check-in__consent {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.face-check-in__notice {
  margin: 0;
  font-size: 13px;
}

.face-check-in__result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.face-check-in__score {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.face-check-in__pass {
  font-size: 12px;
  opacity: 0.65;
}

.face-check-in__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  width: 100%;
}
</style>
