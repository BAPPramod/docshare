<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
          Sign in here
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              v-model="form.name"
              id="name"
              name="name"
              type="text"
              required
              class="mt-1 input"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              v-model="form.email"
              id="email"
              name="email"
              type="email"
              required
              class="mt-1 input"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              v-model="form.password"
              id="password"
              name="password"
              type="password"
              required
              minlength="6"
              class="mt-1 input"
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          <div v-if="registerMutation.error.value" class="text-red-600 text-sm">
            {{ getErrorMessage(registerMutation.error.value, 'Registration failed') }}
          </div>

          <button
            type="submit"
            :disabled="registerMutation.isPending.value"
            class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ registerMutation.isPending.value ? 'Creating account...' : 'Create account' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getErrorMessage } from '@/utils/error';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  name: '',
  email: '',
  password: ''
});

const registerMutation = useMutation({
  mutationFn: async () => {
    await authStore.register(form.email, form.password, form.name);
  },
  onSuccess: () => {
    router.push('/');
  }
});

const handleRegister = () => {
  registerMutation.mutate();
};
</script>