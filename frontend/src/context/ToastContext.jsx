
import { createContext, useContext } from 'react';
import { toast as hotToast } from 'react-hot-toast';
import { LuTriangleAlert, LuInfo } from 'react-icons/lu';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toast = {
    success: (msg) => hotToast.success(msg),
    error: (msg) => hotToast.error(msg),
    warning: (msg) => hotToast(msg, { icon: <LuTriangleAlert style={{ color: '#fbbf24' }} /> }),
    info: (msg) => hotToast(msg, { icon: <LuInfo style={{ color: '#60a5fa' }} /> }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
};
