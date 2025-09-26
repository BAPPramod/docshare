import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, token: userToken } = response.data;
    
    user.value = userData;
    token.value = userToken;
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    const response = await api.post('/auth/register', { email, password, name });
    const { user: userData, token: userToken } = response.data;
    
    user.value = userData;
    token.value = userToken;
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  };

  const logout = (): void => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  // Initialize user from token on store creation
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser) as User;
      } catch {
        user.value = null;
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout
  };
});