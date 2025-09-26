<template>
  <div class="card">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select File (PDF, JPG, PNG only)
        </label>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".pdf,.jpg,.jpeg,.png"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div v-if="selectedFile" class="text-sm text-gray-600">
        Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </div>
      
      <button
        @click="handleUpload"
        :disabled="!selectedFile || uploadMutation.isPending.value"
        class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ uploadMutation.isPending.value ? 'Uploading...' : 'Upload Document' }}
      </button>
      
      <div v-if="uploadMutation.error.value" class="text-red-600 text-sm">
        {{ getErrorMessage(uploadMutation.error.value, 'Upload failed') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { documentsAPI } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

const emit = defineEmits<{
  uploadSuccess: [document: any]
}>();

const queryClient = useQueryClient();
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);

const uploadMutation = useMutation({
  mutationFn: documentsAPI.upload,
  onSuccess: (response) => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    emit('uploadSuccess', response.data);
  }
});

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleUpload = () => {
  if (selectedFile.value) {
    uploadMutation.mutate(selectedFile.value);
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