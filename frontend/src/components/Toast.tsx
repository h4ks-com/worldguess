import React, {useEffect} from 'react';

import {ToastState} from '../types/game';

interface ToastProps {
  toast: ToastState;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({toast, onHide}) => {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onHide]);

  if (!toast.show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        color: 'rgb(31, 41, 55)',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(229, 231, 235, 1)',
        fontSize: '0.875rem',
        fontWeight: '500',
      }}
    >
      {toast.message}
    </div>
  );
};
