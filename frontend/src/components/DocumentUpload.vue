<template>
  <div class="card">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>

    <div class="space-y-4">
      <div>
        <p class="mb-2 block text-sm font-medium text-gray-700">
          Select files (PDF, JPG, PNG only)
        </p>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          @change="handleFileSelect"
        />
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="btn btn-secondary text-sm"
            @click="openFilePicker"
          >
            {{ selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files' }}
          </button>
          <span v-if="selectedFiles.length === 0" class="text-sm text-gray-500">
            No files chosen
          </span>
          <button
            v-else
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700"
            :disabled="uploadMutation.isPending.value"
            @click="clearSelection"
          >
            Clear selection
          </button>
        </div>

        <ul v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
          <li
            v-for="(file, index) in selectedFiles"
            :key="fileKey(file)"
            class="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2"
          >
            <span class="min-w-0 flex-1 break-words text-sm text-gray-700">
              {{ file.name }}
              <span class="text-gray-500">({{ formatFileSize(file.size) }})</span>
            </span>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
              :disabled="uploadMutation.isPending.value"
              aria-label="Remove file"
              @click="removeFile(index)"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <button
        @click="handleUpload"
        :disabled="selectedFiles.length === 0 || uploadMutation.isPending.value"
        class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ uploadButtonLabel }}
      </button>

      <div
        v-if="uploadMutation.error.value"
        class="whitespace-pre-line text-sm text-red-600"
      >
        {{ getErrorMessage(uploadMutation.error.value, 'Upload failed') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { documentsAPI, type Document } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

const emit = defineEmits<{
  uploadSuccess: [documents: Document[]]
}>();

const queryClient = useQueryClient();
const fileInput = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

const validateFile = (file: File): string | null => {
  if (!ALLOWED_EXTENSIONS.test(file.name)) {
    return `${file.name}: only PDF, JPG, and PNG files are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: exceeds 10MB limit.`;
  }
  return null;
};

const uploadMutation = useMutation({
  mutationFn: async (files: File[]) => {
    const responses: Awaited<ReturnType<typeof documentsAPI.upload>>[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      try {
        const response = await documentsAPI.upload(file);
        responses.push(response);
      } catch (err) {
        errors.push(`${file.name}: ${getErrorMessage(err, 'upload failed')}`);
      }
    }

    if (responses.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
    }

    if (errors.length > 0) {
      const summary =
        responses.length > 0
          ? `${errors.length} of ${files.length} file(s) failed:\n${errors.join('\n')}`
          : errors.join('\n');
      throw new Error(summary);
    }

    return responses;
  },
  onSuccess: (responses) => {
    selectedFiles.value = [];
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    emit(
      'uploadSuccess',
      responses.map((r) => r.data)
    );
  }
});

const uploadButtonLabel = computed(() => {
  if (uploadMutation.isPending.value) {
    const total = selectedFiles.value.length;
    return total > 1 ? `Uploading ${total} files...` : 'Uploading...';
  }
  const count = selectedFiles.value.length;
  if (count === 0) return 'Upload';
  if (count === 1) return 'Upload Document';
  return `Upload ${count} Documents`;
});

const openFilePicker = () => {
  fileInput.value?.click();
};

const resetFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const clearSelection = () => {
  selectedFiles.value = [];
  resetFileInput();
};

const removeFile = (index: number) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
  if (selectedFiles.value.length === 0) {
    resetFileInput();
  }
};

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const incoming = Array.from(target.files ?? []);
  if (incoming.length === 0) return;

  const existingKeys = new Set(selectedFiles.value.map(fileKey));
  const merged = [...selectedFiles.value];

  for (const file of incoming) {
    const key = fileKey(file);
    if (!existingKeys.has(key)) {
      merged.push(file);
      existingKeys.add(key);
    }
  }

  selectedFiles.value = merged;
  resetFileInput();
};

const handleUpload = () => {
  if (selectedFiles.value.length > 0) {
    uploadMutation.mutate([...selectedFiles.value]);
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>
