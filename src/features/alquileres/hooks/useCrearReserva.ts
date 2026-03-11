import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reservasApi,
  sucursalesApi,
  recargosApi,
  coberturasApi,
} from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { toast } from '@/store/toast.store';
import { useCalculoPrecio } from './useCalculoPrecio';
import { OrigenReserva } from '../types/reserva';
import type { CreateReservaAlquilerRequest } from '../types/reserva';
import type { WizardStep } from '../types';
import type {
  WizardFormData,
  WizardClienteData,
  WizardVehiculoData,
  WizardOpcionesData,
  WizardClienteErrors,
  WizardVehiculoErrors,
} from '../types/wizard';
import { WIZARD_FORM_INITIAL } from '../types/wizard';

// --- Orden de pasos ---

const PASOS: WizardStep[] = ['cliente', 'vehiculo', 'opciones', 'resumen'];

// --- Validacion ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCliente(data: WizardClienteData, t: (key: string) => string): WizardClienteErrors {
  const errores: WizardClienteErrors = {};

  if (!data.creandoNuevo) {
    if (!data.clienteExistenteId) {
      errores.clienteExistente = t('alquileres.wizard.cliente.errores.clienteRequerido');
    }
    return errores;
  }

  if (!data.nombre.trim()) errores.nombre = t('alquileres.wizard.cliente.errores.nombreRequerido');
  if (!data.apellido.trim()) errores.apellido = t('alquileres.wizard.cliente.errores.apellidoRequerido');
  if (!data.email.trim()) {
    errores.email = t('alquileres.wizard.cliente.errores.emailRequerido');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errores.email = t('alquileres.wizard.cliente.errores.emailInvalido');
  }
  if (!data.tipoDocumento) errores.tipoDocumento = t('alquileres.wizard.cliente.errores.tipoDocumentoRequerido');
  if (!data.numeroDocumento.trim()) errores.numeroDocumento = t('alquileres.wizard.cliente.errores.numeroDocumentoRequerido');

  return errores;
}

function validarVehiculo(data: WizardVehiculoData, t: (key: string) => string): WizardVehiculoErrors {
  const errores: WizardVehiculoErrors = {};

  if (!data.categoriaAlquiler && !data.vehiculoAlquilerId) {
    errores.categoriaAlquiler = t('alquileres.wizard.vehiculo.errores.categoriaRequerida');
  }
  if (!data.sucursalRecogidaId) errores.sucursalRecogidaId = t('alquileres.wizard.vehiculo.errores.sucursalRecogidaRequerida');
  if (!data.sucursalDevolucionId) errores.sucursalDevolucionId = t('alquileres.wizard.vehiculo.errores.sucursalDevolucionRequerida');

  if (!data.fechaHoraRecogida) {
    errores.fechaHoraRecogida = t('alquileres.wizard.vehiculo.errores.fechaRecogidaRequerida');
  } else if (new Date(data.fechaHoraRecogida) <= new Date()) {
    errores.fechaHoraRecogida = t('alquileres.wizard.vehiculo.errores.fechaRecogidaFutura');
  }

  if (!data.fechaHoraDevolucion) {
    errores.fechaHoraDevolucion = t('alquileres.wizard.vehiculo.errores.fechaDevolucionRequerida');
  } else if (data.fechaHoraRecogida && data.fechaHoraDevolucion) {
    const recogida = new Date(data.fechaHoraRecogida);
    const devolucion = new Date(data.fechaHoraDevolucion);
    if (devolucion <= recogida) {
      errores.fechaHoraDevolucion = t('alquileres.wizard.vehiculo.errores.fechaDevolucionPosterior');
    } else if (devolucion.getTime() - recogida.getTime() < 24 * 60 * 60 * 1000) {
      errores.fechasRango = t('alquileres.wizard.vehiculo.errores.duracionMinima');
    }
  }

  return errores;
}

function tieneErrores(errores: WizardClienteErrors | WizardVehiculoErrors): boolean {
  return Object.values(errores).some(v => !!v);
}

// --- Hook ---

export function useCrearReserva(onClose: () => void) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // --- Estado del wizard ---

  const [pasoActual, setPasoActual] = useState<WizardStep>('cliente');
  const [formData, setFormData] = useState<WizardFormData>(WIZARD_FORM_INITIAL);
  const [erroresCliente, setErroresCliente] = useState<WizardClienteErrors>({});
  const [erroresVehiculo, setErroresVehiculo] = useState<WizardVehiculoErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);

  // --- Queries auxiliares ---

  const { data: sucursalesData, isLoading: isLoadingSucursales } = useQuery({
    queryKey: ['sucursales-alquiler-wizard'],
    queryFn: () => sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const sucursales = useMemo(
    () => sucursalesData?.items ?? [],
    [sucursalesData],
  );

  const { data: recargosData, isLoading: isLoadingRecargos } = useQuery({
    queryKey: ['recargos-alquiler-wizard'],
    queryFn: () => recargosApi.list({ soloActivos: true, tamanoPagina: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const recargos = useMemo(
    () => recargosData?.items ?? [],
    [recargosData],
  );

  const { data: coberturasData, isLoading: isLoadingCoberturas } = useQuery({
    queryKey: ['coberturas-alquiler-wizard'],
    queryFn: () => coberturasApi.list({ soloActivas: true, tamanoPagina: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const coberturas = useMemo(
    () => coberturasData?.items ?? [],
    [coberturasData],
  );

  // --- Cotizacion ---

  const cotizacionParams = useMemo(() => ({
    vehiculoAlquilerId: formData.vehiculo.vehiculoAlquilerId ?? undefined,
    categoriaAlquiler: formData.vehiculo.categoriaAlquiler !== '' ? formData.vehiculo.categoriaAlquiler : undefined,
    sucursalRecogidaId: formData.vehiculo.sucursalRecogidaId,
    sucursalDevolucionId: formData.vehiculo.sucursalDevolucionId,
    fechaHoraRecogida: formData.vehiculo.fechaHoraRecogida,
    fechaHoraDevolucion: formData.vehiculo.fechaHoraDevolucion,
    recargosSeleccionadosIds: formData.opciones.recargosSeleccionadosIds,
    coberturasSeleccionadasIds: formData.opciones.coberturasSeleccionadasIds,
    codigoPromocion: formData.opciones.codigoPromocion || undefined,
  }), [formData.vehiculo, formData.opciones]);

  const { cotizacion, isCotizando, error: cotizacionError } = useCalculoPrecio(cotizacionParams);

  // --- Mutation ---

  const crearMutation = useMutation({
    mutationFn: (data: CreateReservaAlquilerRequest) => reservasApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast.success(t('alquileres.wizard.toast.reservaCreada'));
      resetWizard();
      onClose();
    },
    onError: (err: unknown) => {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    },
  });

  // --- Actualizaciones de form data ---

  const updateCliente = useCallback((partial: Partial<WizardClienteData>) => {
    setFormData(prev => ({
      ...prev,
      cliente: { ...prev.cliente, ...partial },
    }));
    setErroresCliente({});
  }, []);

  const updateVehiculo = useCallback((partial: Partial<WizardVehiculoData>) => {
    setFormData(prev => {
      const newVehiculo = { ...prev.vehiculo, ...partial };
      // Si "misma sucursal" esta activo, sincronizar
      if (newVehiculo.mismaSucursal && partial.sucursalRecogidaId !== undefined) {
        newVehiculo.sucursalDevolucionId = partial.sucursalRecogidaId;
      }
      return { ...prev, vehiculo: newVehiculo };
    });
    setErroresVehiculo({});
  }, []);

  const updateOpciones = useCallback((partial: Partial<WizardOpcionesData>) => {
    setFormData(prev => ({
      ...prev,
      opciones: { ...prev.opciones, ...partial },
    }));
  }, []);

  const updateNotas = useCallback((notas: string) => {
    setFormData(prev => ({ ...prev, notas }));
  }, []);

  const updateOrigen = useCallback((origenReserva: number) => {
    setFormData(prev => ({ ...prev, origenReserva }));
  }, []);

  // --- Navegacion ---

  const validarPasoActual = useCallback((): boolean => {
    if (pasoActual === 'cliente') {
      const err = validarCliente(formData.cliente, t);
      setErroresCliente(err);
      return !tieneErrores(err);
    }
    if (pasoActual === 'vehiculo') {
      const err = validarVehiculo(formData.vehiculo, t);
      setErroresVehiculo(err);
      return !tieneErrores(err);
    }
    if (pasoActual === 'resumen') {
      if (!formData.origenReserva) return false;
      if (!cotizacion && !isCotizando) return false;
    }
    return true;
  }, [pasoActual, formData.cliente, formData.vehiculo, formData.origenReserva, cotizacion, isCotizando, t]);

  const avanzar = useCallback(() => {
    if (!validarPasoActual()) return;
    const idx = PASOS.indexOf(pasoActual);
    if (idx < PASOS.length - 1) {
      setPasoActual(PASOS[idx + 1]);
      setApiError(null);
    }
  }, [pasoActual, validarPasoActual]);

  const retroceder = useCallback(() => {
    const idx = PASOS.indexOf(pasoActual);
    if (idx > 0) {
      setPasoActual(PASOS[idx - 1]);
      setApiError(null);
    }
  }, [pasoActual]);

  // --- Crear reserva ---

  const crearReserva = useCallback(() => {
    const { cliente, vehiculo, opciones, notas, origenReserva } = formData;

    // Guard defensivo: si no es cliente nuevo, verificar que clienteExistente no sea null
    if (!cliente.creandoNuevo && !cliente.clienteExistente) {
      setApiError({
        message: t('alquileres.wizard.errores.clienteNoSeleccionado'),
        code: 'Wizard.ClienteNoSeleccionado',
        status: 0,
      });
      return;
    }

    // Safe after guard above: clienteExistente is guaranteed non-null when !creandoNuevo
    const clienteExistente = cliente.clienteExistente;
    const clienteData = cliente.creandoNuevo
      ? {
          clienteNombre: cliente.nombre.trim(),
          clienteApellido: cliente.apellido.trim(),
          clienteEmail: cliente.email.trim(),
          clienteTelefono: cliente.telefono.trim() || undefined,
          clienteTipoDocumento: cliente.tipoDocumento as number,
          clienteNumeroDocumento: cliente.numeroDocumento.trim(),
          clienteFechaNacimiento: cliente.fechaNacimiento || undefined,
          clienteNumeroLicencia: cliente.numeroLicenciaConducir.trim() || undefined,
          clienteVencimientoLicencia: cliente.vencimientoLicencia || undefined,
        }
      : {
          clienteNombre: clienteExistente?.nombre ?? '',
          clienteApellido: clienteExistente?.apellido ?? '',
          clienteEmail: clienteExistente?.email ?? '',
          clienteTelefono: clienteExistente?.telefono || undefined,
          clienteTipoDocumento: clienteExistente?.tipoDocumento ?? 1,
          clienteNumeroDocumento: clienteExistente?.numeroDocumento ?? '',
          clienteFechaNacimiento: clienteExistente?.fechaNacimiento || undefined,
          clienteNumeroLicencia: clienteExistente?.numeroLicenciaConducir || undefined,
          clienteVencimientoLicencia: clienteExistente?.vencimientoLicencia || undefined,
        };

    const request: CreateReservaAlquilerRequest = {
      ...clienteData,
      vehiculoAlquilerId: vehiculo.vehiculoAlquilerId || undefined,
      categoriaAlquiler: vehiculo.categoriaAlquiler !== '' ? vehiculo.categoriaAlquiler : undefined,
      sucursalRecogidaId: vehiculo.sucursalRecogidaId,
      sucursalDevolucionId: vehiculo.sucursalDevolucionId,
      fechaHoraRecogida: vehiculo.fechaHoraRecogida,
      fechaHoraDevolucion: vehiculo.fechaHoraDevolucion,
      recargosSeleccionadosIds: opciones.recargosSeleccionadosIds,
      coberturasSeleccionadasIds: opciones.coberturasSeleccionadasIds,
      codigoPromocion: opciones.codigoPromocion.trim() || undefined,
      origenReserva,
      notas: notas.trim() || undefined,
      claveIdempotencia: formData.claveIdempotencia,
    };

    crearMutation.mutate(request);
  }, [formData, crearMutation, t]);

  // --- Reset ---

  const resetWizard = useCallback(() => {
    setPasoActual('cliente');
    setFormData({ ...WIZARD_FORM_INITIAL, claveIdempotencia: crypto.randomUUID() });
    setErroresCliente({});
    setErroresVehiculo({});
    setApiError(null);
  }, []);

  // --- Opciones de origen para el select del resumen ---

  const origenOptions = useMemo(() =>
    Object.values(OrigenReserva)
      .filter((v): v is number => typeof v === 'number')
      .map(v => ({ value: v, label: t(`alquileres.reservas.origenes.${v}`) })),
    [t],
  );

  return {
    // Navegacion
    pasoActual,
    setPasoActual,
    avanzar,
    retroceder,
    validarPasoActual,

    // Form data
    formData,
    updateCliente,
    updateVehiculo,
    updateOpciones,
    updateNotas,
    updateOrigen,

    // Errores
    erroresCliente,
    erroresVehiculo,
    apiError,

    // Queries auxiliares
    sucursales,
    isLoadingSucursales,
    recargos,
    coberturas,
    isLoadingRecargos,
    isLoadingCoberturas,

    // Cotizacion
    cotizacion,
    isCotizando,
    cotizacionError,

    // Mutation
    crearReserva,
    isCreating: crearMutation.isPending,

    // Opciones
    origenOptions,

    // Lifecycle
    resetWizard,
  };
}
