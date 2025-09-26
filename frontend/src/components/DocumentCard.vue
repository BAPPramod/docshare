<template>
  <div class="card hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-2">
          <div class="p-2 rounded-lg bg-gray-100">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 class="text-lg font-medium text-gray-900 truncate">
              {{ document.originalName }}
            </h4>
            <p class="text-sm text-gray-500">
              {{ formatFileSize(document.size) }} • {{ formatDate(document.createdAt) }}
            </p>
          </div>
        </div>
        
        <div class="text-sm text-gray-600 mb-3">
          <p><strong>Owner:</strong> {{ document.owner.name }} ({{ document.owner.email }})</p>
          <p v-if="document.shares.length > 0">
            <strong>Shared with:</strong> {{ document.shares.map(s => s.user.name).join(', ') }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2 ml-4">
        <button
          @click="handleDownload"
          :disabled="downloadMutation.isPending.value"
          class="btn bg-green-600 text-white hover:bg-green-700 text-sm"
        >
          {{ downloadMutation.isPending.value ? 'Downloading...' : 'Download' }}
        </button>
        
        <button
          v-if="isOwner"
          @click="$emit('share', document)"
          class="btn bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          Share
        </button>
        
        <button
          v-if="isOwner"
          @click="handleDelete"
          :disabled="deleteMutation.isPending.value"
          class="btn btn-danger text-sm"
        >
          {{ deleteMutation.isPending.value ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
    
    <div v-if="downloadMutation.error.value || deleteMutation.error.value" 
         class="mt-2 text-red-600 text-sm">
      {{ getErrorMessage(downloadMutation.error.value) || getErrorMessage(deleteMutation.error.value) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useAuthStore } from '@/stores/auth';
import { documentsAPI, type Document } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

interface Props {
  document: Document;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  share: [document: Document]
}>();

const authStore = useAuthStore();
const queryClient = useQueryClient();

const isOwner = computed(() => 
  authStore.user?.id === props.document.owner.id
);

const downloadMutation = useMutation({
  mutationFn: () => documentsAPI.download(props.document.id),
  onSuccess: (response) => {
    // Create blob and download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = props.document.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
});

const deleteMutation = useMutation({
  mutationFn: () => documentsAPI.delete(props.document.id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  }
});

const handleDownload = () => {
  downloadMutation.mutate();
};

const handleDelete = () => {
  if (confirm(`Are you sure you want to delete "${props.document.originalName}"?`)) {
    deleteMutation.mutate();
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};
</script>