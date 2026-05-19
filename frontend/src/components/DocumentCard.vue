<template>
  <div class="card overflow-hidden transition-shadow hover:shadow-lg">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-start gap-2">
          <div class="shrink-0 rounded-lg bg-gray-100 p-2">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="break-words text-lg font-medium leading-snug text-gray-900">
              {{ document.originalName }}
            </h4>
            <p class="text-sm text-gray-500">
              {{ formatFileSize(document.size) }} • {{ formatDate(document.createdAt) }}
            </p>
          </div>
        </div>
        
        <div class="min-w-0 space-y-1 text-sm text-gray-600">
          <p class="truncate" :title="`${document.owner.name} (${document.owner.email})`">
            <strong>Owner:</strong> {{ document.owner.name }} ({{ document.owner.email }})
          </p>
          <p
            v-if="document.shares.length > 0"
            class="truncate"
            :title="document.shares.map(s => s.user.name).join(', ')"
          >
            <strong>Shared with:</strong> {{ document.shares.map(s => s.user.name).join(', ') }}
          </p>
        </div>
      </div>
      
      <div class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <button
          @click="isPreviewOpen = true"
          class="btn whitespace-nowrap bg-gray-600 text-white hover:bg-gray-700 text-sm"
        >
          View
        </button>

        <button
          @click="handleDownload"
          :disabled="downloadMutation.isPending.value"
          class="btn whitespace-nowrap bg-green-600 text-white hover:bg-green-700 text-sm"
        >
          {{ downloadMutation.isPending.value ? 'Downloading...' : 'Download' }}
        </button>
        
        <button
          v-if="isOwner"
          @click="$emit('share', document)"
          class="btn whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          Share
        </button>
        
        <button
          v-if="isOwner"
          @click="handleDelete"
          :disabled="deleteMutation.isPending.value"
          class="btn btn-danger whitespace-nowrap text-sm"
        >
          {{ deleteMutation.isPending.value ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
    
    <div v-if="downloadMutation.error.value || deleteMutation.error.value" 
         class="mt-2 text-red-600 text-sm">
      {{ getErrorMessage(downloadMutation.error.value) || getErrorMessage(deleteMutation.error.value) }}
    </div>

    <DocumentPreviewModal
      :is-open="isPreviewOpen"
      :document="document"
      @close="isPreviewOpen = false"
    />

    <ConfirmModal
      :is-open="isDeleteConfirmOpen"
      title="Delete document?"
      :message="deleteConfirmMessage"
      confirm-label="Delete"
      cancel-label="Cancel"
      loading-label="Deleting..."
      :loading="deleteMutation.isPending.value"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="isDeleteConfirmOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import DocumentPreviewModal from '@/components/DocumentPreviewModal.vue';
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
const isPreviewOpen = ref(false);
const isDeleteConfirmOpen = ref(false);

const deleteConfirmMessage = computed(
  () =>
    `Are you sure you want to delete "${props.document.originalName}"? This action cannot be undone.`
);

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
    isDeleteConfirmOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  }
});

const handleDownload = () => {
  downloadMutation.mutate();
};

const handleDelete = () => {
  isDeleteConfirmOpen.value = true;
};

const confirmDelete = () => {
  deleteMutation.mutate();
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