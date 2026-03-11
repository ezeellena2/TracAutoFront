import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthClienteState {
  token: string | null;
  clienteId: string | null;
  email: string | null;
  nombreCompleto: string | null;
  expiresAt: string | null;

  setAuth: (data: {
    token: string;
    clienteId: string;
    email: string;
    nombreCompleto: string;
    expiresAt: string;
  }) => void;
  logout: () => void;
}

export const useAuthClienteStore = create<AuthClienteState>()(
  persist(
    (set) => ({
      token: null,
      clienteId: null,
      email: null,
      nombreCompleto: null,
      expiresAt: null,

      setAuth: (data) =>
        set({
          token: data.token,
          clienteId: data.clienteId,
          email: data.email,
          nombreCompleto: data.nombreCompleto,
          expiresAt: data.expiresAt,
        }),

      logout: () =>
        set({
          token: null,
          clienteId: null,
          email: null,
          nombreCompleto: null,
          expiresAt: null,
        }),
    }),
    {
      name: 'tracauto-auth-cliente',
      partialize: (state) => ({
        token: state.token,
        clienteId: state.clienteId,
        email: state.email,
        nombreCompleto: state.nombreCompleto,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);

export const selectIsAuthenticated = (state: AuthClienteState) =>
  !!state.token && !!state.expiresAt && new Date(state.expiresAt) > new Date();

export const selectIsTokenExpired = (state: AuthClienteState) =>
  !state.expiresAt || new Date(state.expiresAt) <= new Date();
