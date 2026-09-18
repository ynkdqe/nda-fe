<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import { useVbenModal, VbenAvatar } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { uploadProfileAvatarApi } from '#/api';
import { $t } from '#/locales';

const props = defineProps<{ avatar?: string }>();
const emit = defineEmits<{ uploaded: [url: string] }>();

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const userStore = useUserStore();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref('');
const decoding = ref(false);
const saving = ref(false);
const isOpen = ref(false);
let objectUrl = '';

let selectionVersion = 0;
let disposed = false;

const currentAvatar = computed(
  () =>
    props.avatar || userStore.userInfo?.avatar || preferences.app.defaultAvatar,
);

function resetSelection() {
  selectionVersion += 1;
  selectedFile.value = null;
  previewUrl.value = '';

  decoding.value = false;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = '';
  }
  if (fileInput.value) fileInput.value.value = '';
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || saving.value || !isOpen.value || disposed) return;

  resetSelection();
  if (!ALLOWED_TYPES.has(file.type)) {
    message.error($t('page.profile.avatarUpload.invalidType'));
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    message.error($t('page.profile.avatarUpload.tooLarge'));
    return;
  }

  const version = selectionVersion;
  decoding.value = true;
  try {
    const url = URL.createObjectURL(file);
    objectUrl = url;
    const image = new Image();
    image.src = url;
    await image.decode();
    // A newer selection, close, or unmount invalidates this decode result.
    if (version !== selectionVersion || disposed) return;
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Invalid image dimensions');
    }
    selectedFile.value = file;
    previewUrl.value = url;
  } catch {
    if (version !== selectionVersion || disposed) return;
    resetSelection();
    message.error($t('page.profile.avatarUpload.invalidImage'));
  } finally {
    if (version === selectionVersion) decoding.value = false;
  }
}

async function handleSave() {
  const file = selectedFile.value;

  if (!file || decoding.value || saving.value || !isOpen.value || disposed) {
    return;
  }

  saving.value = true;
  modalApi.lock();
  let saved = false;
  try {
    const avatar = await uploadProfileAvatarApi(file);
    if (disposed) return;
    emit('uploaded', avatar);
    saved = true;
    message.info($t('page.profile.avatarUpload.pendingSave'));
  } catch {
    // The upload service already notifies errors; keep the selection for retry.
  } finally {
    saving.value = false;
    modalApi.unlock();
    if (saved && !disposed) await modalApi.close();
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onBeforeClose: () => !saving.value,
  onConfirm: handleSave,
  onOpenChange(open) {
    isOpen.value = open;
    resetSelection();
  },
});

onBeforeUnmount(() => {
  disposed = true;
  resetSelection();
});
</script>

<template>
  <VbenAvatar
    :src="currentAvatar"
    :alt="$t('page.profile.avatar')"
    class="size-20"
  />
  <NButton size="small" :disabled="saving" @click="modalApi.open()">
    {{ $t('page.profile.avatarUpload.change') }}
  </NButton>
  <Modal
    :title="$t('page.profile.avatarUpload.title')"
    :confirm-text="$t('page.profile.avatarUpload.save')"
    :cancel-text="$t('page.profile.avatarUpload.cancel')"
    :confirm-disabled="!selectedFile || decoding || saving"
    :confirm-loading="saving"
    :closable="!saving"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    class="md:w-[440px]"
  >
    <div class="flex flex-col items-center gap-4">
      <VbenAvatar
        :src="previewUrl || currentAvatar"
        :alt="$t('page.profile.avatarUpload.preview')"
        class="size-40"
      />
      <p class="text-muted-foreground text-center text-sm">
        {{ $t('page.profile.avatarUpload.hint') }}
      </p>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        :aria-label="$t('page.profile.avatarUpload.choose')"
        :disabled="saving"
        class="hidden"
        @change="handleFileChange"
      />
      <NButton :disabled="saving" @click="fileInput?.click()">
        {{
          $t(
            selectedFile
              ? 'page.profile.avatarUpload.chooseAnother'
              : 'page.profile.avatarUpload.choose',
          )
        }}
      </NButton>
      <p v-if="decoding" role="status" class="text-sm">
        {{ $t('page.profile.avatarUpload.checking') }}
      </p>
      <p v-else-if="selectedFile" class="max-w-full break-all text-sm">
        {{ selectedFile.name }}
      </p>
    </div>
  </Modal>
</template>
