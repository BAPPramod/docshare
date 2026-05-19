<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 pb-28"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4" role="dialog" aria-modal="true">
      <div class="mb-4 flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          :class="variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'"
        >
          <svg
            class="h-5 w-5"
            :class="variant === 'danger' ? 'text-red-600' : 'text-blue-600'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="variant === 'danger'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          <p class="mt-2 break-words text-sm text-gray-600">{{ message }}</p>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="btn disabled:cursor-not-allowed disabled:opacity-50"
          :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? loadingLabel : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loadingLabel?: string;
    loading?: boolean;
    variant?: 'danger' | 'primary';
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    loadingLabel: 'Please wait...',
    loading: false,
    variant: 'danger'
  }
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
