/**
 * Toast Notification Component
 *
 * Simple, clean toast notifications for user feedback
 */

import { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up z-50 max-w-md`}
      role="alert"
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
