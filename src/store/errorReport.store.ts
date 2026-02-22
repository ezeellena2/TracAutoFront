import { create } from 'zustand';
import type { ErrorReportContext } from '@/shared/errors';

interface ErrorReportState {
  isOpen: boolean;
  context: ErrorReportContext | null;
  open: (context: ErrorReportContext) => void;
  close: () => void;
  clear: () => void;
}

export const useErrorReportStore = create<ErrorReportState>((set) => ({
  isOpen: false,
  context: null,
  open: (context) => set({ isOpen: true, context }),
  close: () => set({ isOpen: false }),
  clear: () => set({ isOpen: false, context: null }),
}));
