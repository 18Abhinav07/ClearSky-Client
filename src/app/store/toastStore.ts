
import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const useToastStore = create<ToastState>()((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  showToast: (message: string, type: 'success' | 'error' | 'info') => set({ message, type, isVisible: true }),
  hideToast: () => set({ isVisible: false }),
}));

// Custom hook to provide a cleaner API
export const useToast = () => {
  const { showToast } = useToastStore();

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info'),
  };
};

export default useToastStore;
