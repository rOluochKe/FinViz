import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: any) => {
    toast.success(message, options);
  },

  error: (message: string, options?: any) => {
    toast.error(message, options);
  },

  info: (message: string, options?: any) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
      },
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    toast(message, {
      icon: '⚠️',
      duration: 5000,
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B',
      },
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, options);
  },
};

export default showToast;
