<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
        Sign in to DocShare Mini
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Don't have an account?
        <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500">
          Register here
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-6">
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
              class="mt-1 input"
              placeholder="Enter your password"
            />
          </div>

          <div v-if="loginMutation.error.value" class="text-red-600 text-sm">
            {{ getErrorMessage(loginMutation.error.value, 'Login failed') }}
          </div>

          <button
            type="submit"
            :disabled="loginMutation.isPending.value"
            class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loginMutation.isPending.value ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        
        <div class="mt-6 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-600">
            <strong>Test accounts:</strong><br>
            alice@example.com / password123<br>
            bob@example.com / password123<br>
            carol@example.com / password123
          </p>
        </div>
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
  email: '',
  password: ''
});

const loginMutation = useMutation({
  mutationFn: async () => {
    await authStore.login(form.email, form.password);
  },
  onSuccess: () => {
    router.push('/');
  }
});

const handleLogin = () => {
  loginMutation.mutate();
};
</script>