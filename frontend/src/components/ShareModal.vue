<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="flex items-center mb-4">
        <div class="min-w-0 flex-1 mr-3">
          <h3
            class="text-lg font-medium text-gray-900 truncate"
            :title="titleText"
          >
            Share "{{ document?.originalName }}"
          </h3>
        </div>
        <button @click="$emit('close')" class="shrink-0 text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Enter user email to share with:
          </label>
          <input
            v-model="shareEmail"
            type="email"
            placeholder="user@example.com"
            class="input"
            @keyup.enter="handleShare"
          />
        </div>
        
        <div class="flex space-x-3">
          <button
            @click="handleShare"
            :disabled="!shareEmail || shareMutation.isPending.value"
            class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ shareMutation.isPending.value ? 'Sharing...' : 'Share' }}
          </button>
          <button @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
        </div>
        
        <div v-if="shareMutation.error.value" class="text-red-600 text-sm">
          {{ getErrorMessage(shareMutation.error.value, 'Failed to share document') }}
        </div>
        
        <div v-if="shareMutation.isSuccess.value" class="text-green-600 text-sm">
          Document shared successfully!
        </div>
      </div>
      
      <!-- Current shares -->
      <div v-if="localShares.length" class="mt-6 pt-4 border-t">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Currently shared with:</h4>
        <div class="space-y-2">
          <div
            v-for="share in localShares"
            :key="share.user.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded-md"
          >
            <span class="text-sm">{{ share.user.name }} ({{ share.user.email }})</span>
            <button
              @click="handleUnshare(share.user.id)"
              :disabled="unshareMutation.isPending.value"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { sharesAPI, type Document } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

interface Props {
  isOpen: boolean;
  document: Document | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: []
}>();

const queryClient = useQueryClient();
const shareEmail = ref('');

// Local reactive copy of shares so UI updates instantly
const localShares = ref(props.document?.shares ?? []);

const titleText = computed(() => {
  const name = props.document?.originalName;
  return name ? 'Share "' + name + '"' : 'Share';
});

watch(() => props.document, (doc) => {
  localShares.value = doc?.shares ?? [];
}, { immediate: true });

const shareMutation = useMutation({
  mutationFn: ({ documentId, email }: { documentId: number; email: string }) =>
    sharesAPI.share(documentId, email),
  onSuccess: (response) => {
    // Optimistically append the newly shared user to the local list
    const newShare = (response as any)?.data;
    if (newShare?.user && Array.isArray(localShares.value)) {
      const exists = localShares.value.some((s) => s.user.id === newShare.user.id);
      if (!exists) {
        localShares.value = [...localShares.value, newShare];
      }
    }
    // Also refresh server state
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    shareEmail.value = '';
  }
});

const unshareMutation = useMutation({
  mutationFn: ({ documentId, userId }: { documentId: number; userId: number }) =>
    sharesAPI.unshare(documentId, userId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    // Optimistically update local shares list to reflect removal
    if (props.document) {
      localShares.value = localShares.value.filter(s => s.user.id !== pendingRemovalUserId.value);
    }
  }
});

const pendingRemovalUserId = ref<number | null>(null);

const handleShare = () => {
  if (shareEmail.value && props.document) {
    shareMutation.mutate({
      documentId: props.document.id,
      email: shareEmail.value
    });
  }
};

const handleUnshare = (userId: number) => {
  if (props.document && confirm('Remove access for this user?')) {
    pendingRemovalUserId.value = userId;
    unshareMutation.mutate({
      documentId: props.document.id,
      userId
    });
  }
};

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    shareEmail.value = '';
    shareMutation.reset();
    unshareMutation.reset();
  }
});
</script>