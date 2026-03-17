import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billing.api';
import type { CrearSuscripcionRequest } from '../types';

const KEYS = {
  subscription: ['billing', 'subscription'] as const,
  plans: ['billing', 'plans'] as const,
  modulosActivos: ['billing', 'modulos-activos'] as const,
  modulosDisponibles: ['billing', 'modulos-disponibles'] as const,
  usage: ['billing', 'usage'] as const,
};

export function useBillingData() {
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: KEYS.subscription,
    queryFn: billingApi.getSuscripcionActual,
    staleTime: 5 * 60 * 1000, // 5 min (alineado con cache backend)
  });

  const plansQuery = useQuery({
    queryKey: KEYS.plans,
    queryFn: billingApi.getPlanes,
    staleTime: 30 * 60 * 1000, // 30 min
  });

  const modulosActivosQuery = useQuery({
    queryKey: KEYS.modulosActivos,
    queryFn: billingApi.getModulosActivos,
    staleTime: 5 * 60 * 1000,
  });

  const modulosDisponiblesQuery = useQuery({
    queryKey: KEYS.modulosDisponibles,
    queryFn: billingApi.getModulosDisponibles,
    staleTime: 30 * 60 * 1000,
  });

  // No depende de datos de subscriptionQuery; se lanza en paralelo
  const usageQuery = useQuery({
    queryKey: KEYS.usage,
    queryFn: billingApi.getUsoModulos,
    staleTime: 2 * 60 * 1000, // 2 min (alineado con cache backend)
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['billing'] });
  };

  const cancelMutation = useMutation({
    mutationFn: billingApi.cancelarSuscripcion,
    onSuccess: invalidateAll,
  });

  const reactivateMutation = useMutation({
    mutationFn: billingApi.reactivarSuscripcion,
    onSuccess: invalidateAll,
  });

  const crearSuscripcionMutation = useMutation({
    mutationFn: (request: CrearSuscripcionRequest) => billingApi.crearSuscripcion(request),
    onSuccess: invalidateAll,
  });

  const activarModuloMutation = useMutation({
    mutationFn: billingApi.activarModulo,
    onSuccess: invalidateAll,
  });

  const desactivarModuloMutation = useMutation({
    mutationFn: billingApi.desactivarModulo,
    onSuccess: invalidateAll,
  });

  const isLoading =
    subscriptionQuery.isLoading || plansQuery.isLoading || modulosActivosQuery.isLoading;

  const error =
    subscriptionQuery.error || plansQuery.error || modulosActivosQuery.error;

  return {
    // Data
    subscription: subscriptionQuery.data ?? null,
    plans: plansQuery.data ?? [],
    modulosActivos: modulosActivosQuery.data ?? [],
    modulosDisponibles: modulosDisponiblesQuery.data ?? [],
    usage: usageQuery.data ?? [],

    // Loading / Error
    isLoading,
    error,

    // Mutations
    cancelSubscription: cancelMutation,
    reactivateSubscription: reactivateMutation,
    crearSuscripcion: crearSuscripcionMutation,
    activarModulo: activarModuloMutation,
    desactivarModulo: desactivarModuloMutation,

    // Checkout redirects
    openBillingPortal: billingApi.crearBillingPortalSession,
    openCheckoutSession: billingApi.crearCheckoutSession,

    // Refetch
    refetch: invalidateAll,
  };
}
