<template>
  <Layout>
    <div class="space-y-8">
      <!-- Upload Section -->
      <DocumentUpload @upload-success="onUploadSuccess" />
      
      <!-- Documents Section -->
      <div v-if="documentsQuery.isLoading.value" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading documents...</p>
      </div>
      
      <div v-else-if="documentsQuery.error.value" class="card">
        <div class="text-red-600">
          Failed to load documents: {{ getErrorMessage(documentsQuery.error.value, 'Unknown error') }}
        </div>
      </div>
      
      <div v-else class="space-y-8">
        <!-- My Documents -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">My Documents</h2>
          <div v-if="documentsQuery.data.value?.owned.length === 0" class="card">
            <p class="text-gray-600 text-center py-8">
              No documents uploaded yet. Upload your first document above!
            </p>
          </div>
          <div v-else class="grid gap-4">
            <DocumentCard
              v-for="document in documentsQuery.data.value?.owned"
              :key="`owned-${document.id}`"
              :document="document"
              @share="openShareModal"
            />
          </div>
        </div>
        
        <!-- Shared Documents -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Shared with Me</h2>
          <div v-if="documentsQuery.data.value?.shared.length === 0" class="card">
            <p class="text-gray-600 text-center py-8">
              No documents shared with you yet.
            </p>
          </div>
          <div v-else class="grid gap-4">
            <DocumentCard
              v-for="document in documentsQuery.data.value?.shared"
              :key="`shared-${document.id}`"
              :document="document"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Share Modal -->
    <ShareModal
      :is-open="shareModal.isOpen"
      :document="shareModal.document"
      @close="closeShareModal"
    />
  </Layout>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import Layout from '@/components/Layout.vue';
import DocumentUpload from '@/components/DocumentUpload.vue';
import DocumentCard from '@/components/DocumentCard.vue';
import ShareModal from '@/components/ShareModal.vue';
import { documentsAPI, type Document } from '@/services/api';
import { getErrorMessage } from '@/utils/error';

const shareModal = reactive<{
  isOpen: boolean;
  document: Document | null;
}>({
  isOpen: false,
  document: null
});

const documentsQuery = useQuery({
  queryKey: ['documents'],
  queryFn: documentsAPI.getAll,
  refetchOnWindowFocus: false
});

const onUploadSuccess = (document: Document) => {
  // The query will automatically refetch due to invalidation in the upload component
  console.log('Document uploaded successfully:', document);
};

const openShareModal = (document: Document) => {
  shareModal.document = document;
  shareModal.isOpen = true;
};

const closeShareModal = () => {
  shareModal.isOpen = false;
  shareModal.document = null;
};
</script>