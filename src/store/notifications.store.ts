import { create } from 'zustand';
import type { NotificacionDto } from '@/shared/types/notifications';

function dedupeById(items: NotificacionDto[]): NotificacionDto[] {
  const seen = new Set<string>();
  const output: NotificacionDto[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

interface NotificationsState {
  recent: NotificacionDto[];
  unreadCount: number;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  setConnectionState: (state: NotificationsState['connectionState']) => void;
  setRecent: (items: NotificacionDto[]) => void;
  setUnreadCount: (count: number) => void;
  appendNotification: (notification: NotificacionDto) => void;
  markAsReadOptimistic: (id: string) => void;
  markAllAsReadOptimistic: () => void;
  archivarOptimistic: (id: string) => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  recent: [],
  unreadCount: 0,
  connectionState: 'disconnected',
  isLoading: false,

  setLoading: (loading) => set({ isLoading: loading }),
  setConnectionState: (state) => set({ connectionState: state }),
  setRecent: (items) => set({ recent: dedupeById(items) }),
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

  appendNotification: (notification) =>
    set((state) => {
      const alreadyExists = state.recent.some((n) => n.id === notification.id);
      return {
        recent: dedupeById([notification, ...state.recent]).slice(0, 20),
        unreadCount: alreadyExists || notification.leida ? state.unreadCount : state.unreadCount + 1,
      };
    }),

  markAsReadOptimistic: (id) =>
    set((state) => {
      let descuento = 0;
      const recent = state.recent.map((n) => {
        if (n.id !== id || n.leida) return n;
        descuento += 1;
        return { ...n, leida: true, fechaLectura: new Date().toISOString() };
      });
      return {
        recent,
        unreadCount: Math.max(0, state.unreadCount - descuento),
      };
    }),

  markAllAsReadOptimistic: () =>
    set((state) => ({
      recent: state.recent.map((n) => ({ ...n, leida: true, fechaLectura: n.fechaLectura ?? new Date().toISOString() })),
      unreadCount: 0,
    })),

  archivarOptimistic: (id) =>
    set((state) => {
      const item = state.recent.find((n) => n.id === id);
      const wasUnread = item && !item.leida;
      return {
        recent: state.recent.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),

  reset: () =>
    set({
      recent: [],
      unreadCount: 0,
      connectionState: 'disconnected',
      isLoading: false,
    }),
}));
