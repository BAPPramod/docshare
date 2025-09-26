import axios from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Operation failed'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (typeof error.message === 'string' && error.message) return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as any).message;
    if (typeof m === 'string' && m) return m;
  }
  return fallback;
}


