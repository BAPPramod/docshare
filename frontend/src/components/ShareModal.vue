<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="mb-4 flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="break-words text-lg font-medium leading-snug text-gray-900">
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
            class="flex items-start justify-between gap-2 rounded-md bg-gray-50 p-2"
          >
            <span class="min-w-0 flex-1 break-words text-sm">
              {{ share.user.name }} ({{ share.user.email }})
            </span>
            <button
              @click="handleUnshare(share.user)"
              :disabled="unshareMutation.isPending.value"
              class="shrink-0 text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="!!removalTarget"
      title="Remove access?"
      :message="removalMessage"
      confirm-label="Remove"
      cancel-label="Cancel"
      loading-label="Removing..."
      :loading="unshareMutation.isPending.value"
      variant="danger"
      @confirm="confirmUnshare"
      @cancel="cancelUnshare"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { sharesAPI, type Document, type User } from '@/services/api';
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

const removalTarget = ref<User | null>(null);

const removalMessage = computed(() => {
  if (!removalTarget.value) return '';
  const { name, email } = removalTarget.value;
  return `Remove access for ${name} (${email})? They will no longer be able to view or download this document.`;
});

const unshareMutation = useMutation({
  mutationFn: ({ documentId, userId }: { documentId: number; userId: number }) =>
    sharesAPI.unshare(documentId, userId),
  onSuccess: (_data, variables) => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    localShares.value = localShares.value.filter(s => s.user.id !== variables.userId);
    removalTarget.value = null;
  }
});

const handleShare = () => {
  if (shareEmail.value && props.document) {
    shareMutation.mutate({
      documentId: props.document.id,
      email: shareEmail.value
    });
  }
};

const handleUnshare = (user: User) => {
  removalTarget.value = user;
};

const confirmUnshare = () => {
  if (props.document && removalTarget.value) {
    unshareMutation.mutate({
      documentId: props.document.id,
      userId: removalTarget.value.id
    });
  }
};

const cancelUnshare = () => {
  if (!unshareMutation.isPending.value) {
    removalTarget.value = null;
  }
};

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    shareEmail.value = '';
    removalTarget.value = null;
    shareMutation.reset();
    unshareMutation.reset();
  }
});
</script>