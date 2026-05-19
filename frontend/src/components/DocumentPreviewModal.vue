<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="emit('close')"
  >
    <div class="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
      <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <h3
          class="min-w-0 flex-1 truncate pr-3 text-lg font-medium text-gray-900"
          :title="document?.originalName"
        >
          {{ document?.originalName }}
        </h3>
        <button
          type="button"
          class="shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Close preview"
          @click="handleClose"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex min-h-[200px] flex-1 items-center justify-center overflow-auto p-4">
        <div v-if="isLoading" class="text-gray-500">Loading preview...</div>
        <div v-else-if="error" class="text-center text-red-600">{{ error }}</div>
        <iframe
          v-else-if="isPdf && previewUrl"
          :src="previewUrl"
          class="h-[75vh] w-full rounded border border-gray-200"
          :title="document?.originalName"
        />
        <img
          v-else-if="isImage && previewUrl"
          :src="previewUrl"
          :alt="document?.originalName"
          class="max-h-[75vh] max-w-full object-contain"
        />
        <div v-else class="text-gray-500">Preview not available for this file type.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { documentsAPI, type Document } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

interface Props {
  isOpen: boolean;
  document: Document | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const previewUrl = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isPdf = computed(() => props.document?.mimeType === 'application/pdf');
const isImage = computed(() =>
  props.document?.mimeType === 'image/jpeg' || props.document?.mimeType === 'image/png'
);

const revokePreviewUrl = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

const loadPreview = async () => {
  if (!props.document) return;

  revokePreviewUrl();
  isLoading.value = true;
  error.value = null;

  try {
    const response = await documentsAPI.view(props.document.id);
    const blob = new Blob([response.data], { type: props.document.mimeType });
    previewUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    error.value = getErrorMessage(err, 'Failed to load preview');
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [props.isOpen, props.document?.id] as const,
  ([open]) => {
    if (open && props.document) {
      loadPreview();
    } else {
      revokePreviewUrl();
      error.value = null;
    }
  }
);

onUnmounted(revokePreviewUrl);

const handleClose = () => {
  emit('close');
};
</script>
