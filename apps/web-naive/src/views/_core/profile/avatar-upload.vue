<script setup lang="ts">
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';

import { ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';
import { NUpload, useMessage } from 'naive-ui';

interface Props {
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
});

const emit = defineEmits<{
  'update:modelValue': [string];
}>();

const accessStore = useAccessStore();
const naiveMessage = useMessage();
const uploading = ref(false);
const fileListRef = ref<UploadFileInfo[]>([]);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      fileListRef.value = [
        {
          id: 'avatar-current',
          name: 'avatar',
          status: 'finished',
          url: val,
        },
      ];
    } else {
      fileListRef.value = [];
    }
  },
  { immediate: true },
);

async function customUploadRequest({
  file,
  onFinish,
  onError,
  onProgress,
}: UploadCustomRequestOptions) {
  uploading.value = true;

  const uploadUrl = import.meta.env.VITE_APP_UPLOAD_URL;
  const token = accessStore.accessToken;

  if (!uploadUrl) {
    naiveMessage.error('VITE_APP_UPLOAD_URL chưa được cấu hình');
    onError();
    uploading.value = false;
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file.file as File);

    // Use XMLHttpRequest to support upload progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress({ percent: Math.round((e.loaded * 100) / e.total) });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const url =
              response?.data?.url ||
              response?.url ||
              response?.data?.fileUrl ||
              response?.fileUrl ||
              response?.data?.path ||
              response?.path ||
              '';

            if (url) {
              emit('update:modelValue', url);
              onFinish();
              resolve();
            } else {
              reject(new Error('Upload thành công nhưng không nhận được URL'));
            }
          } catch {
            reject(new Error('Không thể đọc phản hồi từ server'));
          }
        } else {
          reject(new Error(`Upload thất bại: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Lỗi kết nối mạng')));
      xhr.addEventListener('abort', () => reject(new Error('Upload bị hủy')));

      xhr.send(formData);
    });
  } catch (error: any) {
    naiveMessage.error(error?.message || 'Upload thất bại');
    onError();
  } finally {
    uploading.value = false;
  }
}

function handleChange(data: { fileList: UploadFileInfo[] }) {
  fileListRef.value = data.fileList;
  if (data.fileList.length === 0) {
    emit('update:modelValue', '');
  }
}
</script>

<template>
  <NUpload
    :custom-request="customUploadRequest"
    :file-list="fileListRef"
    :max="1"
    accept="image/png,image/jpeg,image/gif,image/webp"
    list-type="image-card"
    @change="handleChange"
  />
</template>
