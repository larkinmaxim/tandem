import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string) => void;
  dismissToast: (id: string) => void;
}

const TOAST_DURATION_MS = 3000;

let nextId = 0;
const makeId = () => `toast-${++nextId}-${Date.now()}`;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message) => {
    const id = makeId();
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => {
      if (get().toasts.some((t) => t.id === id)) {
        get().dismissToast(id);
      }
    }, TOAST_DURATION_MS);
  },
  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
