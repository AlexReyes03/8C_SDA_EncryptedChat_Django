import { createContext } from 'react';

export interface ToastContextProps {
  showToast: (message: string) => void;
}

export const ToastContext = createContext<ToastContextProps | undefined>(undefined);
