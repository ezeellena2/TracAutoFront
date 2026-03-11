import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionAlquilerApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { UpdateConfiguracionAlquilerRequest } from '../types/configuracion';
import { PoliticaCancelacion } from '../types/configuracion';

export interface ConfigFormState {
  requiereSenalAlReservar: boolean;
  porcentajeSenal: string;
  politicaCancelacion: PoliticaCancelacion;
  diasAntesCancelacionGratis: string;
  porcentajePenalizacion: string;
  monedaPorDefecto: string;
  horasExpiracionTentativa: string;
  stripeAccountId: string;
  emailNotificacionReservas: string;
  precioPorLitroCombustible: string;
  precioPorHoraExtra: string;
}

export interface ConfigFormErrors {
  porcentajeSenal?: string;
  politicaCancelacion?: string;
  diasAntesCancelacionGratis?: string;
  porcentajePenalizacion?: string;
  monedaPorDefecto?: string;
  horasExpiracionTentativa?: string;
  stripeAccountId?: string;
  emailNotificacionReservas?: string;
  precioPorLitroCombustible?: string;
  precioPorHoraExtra?: string;
}

const INITIAL_FORM: ConfigFormState = {
  requiereSenalAlReservar: false,
  porcentajeSenal: '0',
  politicaCancelacion: PoliticaCancelacion.Flexible,
  diasAntesCancelacionGratis: '0',
  porcentajePenalizacion: '0',
  monedaPorDefecto: 'ARS',
  horasExpiracionTentativa: '24',
  stripeAccountId: '',
  emailNotificacionReservas: '',
  precioPorLitroCombustible: '0',
  precioPorHoraExtra: '0',
};

function validateForm(form: ConfigFormState, t: (key: string) => string): ConfigFormErrors {
  const errors: ConfigFormErrors = {};

  const senal = Number(form.porcentajeSenal);
  if (isNaN(senal) || senal < 0 || senal > 100) {
    errors.porcentajeSenal = t('alquileres.configuracion.errores.porcentaje0a100');
  }

  if (!Object.values(PoliticaCancelacion).includes(form.politicaCancelacion)) {
    errors.politicaCancelacion = t('alquileres.configuracion.errores.politicaInvalida');
  }

  const dias = Number(form.diasAntesCancelacionGratis);
  if (isNaN(dias) || dias < 0 || !Number.isInteger(dias)) {
    errors.diasAntesCancelacionGratis = t('alquileres.configuracion.errores.diasMinimo0');
  }

  const penalizacion = Number(form.porcentajePenalizacion);
  if (isNaN(penalizacion) || penalizacion < 0 || penalizacion > 100) {
    errors.porcentajePenalizacion = t('alquileres.configuracion.errores.porcentaje0a100');
  }

  if (!form.monedaPorDefecto.trim()) {
    errors.monedaPorDefecto = t('alquileres.configuracion.errores.monedaRequerida');
  } else if (form.monedaPorDefecto.trim().length > 3) {
    errors.monedaPorDefecto = t('alquileres.configuracion.errores.monedaMax3');
  }

  const horas = Number(form.horasExpiracionTentativa);
  if (isNaN(horas) || horas <= 0 || !Number.isInteger(horas)) {
    errors.horasExpiracionTentativa = t('alquileres.configuracion.errores.horasMinimo1');
  }

  if (form.emailNotificacionReservas.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.emailNotificacionReservas.trim())) {
      errors.emailNotificacionReservas = t('alquileres.configuracion.errores.emailInvalido');
    } else if (form.emailNotificacionReservas.trim().length > 320) {
      errors.emailNotificacionReservas = t('alquileres.configuracion.errores.emailMax320');
    }
  }

  if (form.stripeAccountId.trim().length > 255) {
    errors.stripeAccountId = t('alquileres.configuracion.errores.stripeMax255');
  }

  const precioLitro = Number(form.precioPorLitroCombustible);
  if (isNaN(precioLitro) || precioLitro < 0) {
    errors.precioPorLitroCombustible = t('alquileres.configuracion.errores.precioMinimo0');
  }

  const precioHora = Number(form.precioPorHoraExtra);
  if (isNaN(precioHora) || precioHora < 0) {
    errors.precioPorHoraExtra = t('alquileres.configuracion.errores.precioMinimo0');
  }

  return errors;
}

export function useConfiguracionAlquiler() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ConfigFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<ConfigFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);

  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ['alquiler-configuracion'],
    queryFn: () => configuracionAlquilerApi.get(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setForm({
        requiereSenalAlReservar: data.requiereSenalAlReservar,
        porcentajeSenal: String(data.porcentajeSenal),
        politicaCancelacion: data.politicaCancelacion,
        diasAntesCancelacionGratis: String(data.diasAntesCancelacionGratis),
        porcentajePenalizacion: String(data.porcentajePenalizacion),
        monedaPorDefecto: data.monedaPorDefecto,
        horasExpiracionTentativa: String(data.horasExpiracionTentativa),
        stripeAccountId: data.stripeAccountId ?? '',
        emailNotificacionReservas: data.emailNotificacionReservas ?? '',
        precioPorLitroCombustible: String(data.precioPorLitroCombustible),
        precioPorHoraExtra: String(data.precioPorHoraExtra),
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateConfiguracionAlquilerRequest) =>
      configuracionAlquilerApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alquiler-configuracion'] });
      toast.success(t('alquileres.configuracion.guardadoExito'));
      setApiError(null);
    },
    onError: (error: unknown) => {
      const parsed = handleApiError(error, { showToast: false });
      setApiError(parsed);
    },
  });

  const handleChange = useCallback(
    (field: keyof ConfigFormState, value: string | boolean | number) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const validationErrors = validateForm(form, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const request: UpdateConfiguracionAlquilerRequest = {
      requiereSenalAlReservar: form.requiereSenalAlReservar,
      porcentajeSenal: Number(form.porcentajeSenal),
      politicaCancelacion: form.politicaCancelacion,
      diasAntesCancelacionGratis: Number(form.diasAntesCancelacionGratis),
      porcentajePenalizacion: Number(form.porcentajePenalizacion),
      monedaPorDefecto: form.monedaPorDefecto.trim(),
      horasExpiracionTentativa: Number(form.horasExpiracionTentativa),
      stripeAccountId: form.stripeAccountId.trim() || null,
      emailNotificacionReservas: form.emailNotificacionReservas.trim() || null,
      precioPorLitroCombustible: Number(form.precioPorLitroCombustible),
      precioPorHoraExtra: Number(form.precioPorHoraExtra),
    };

    updateMutation.mutate(request);
  }, [form, t, updateMutation]);

  return {
    form,
    errors,
    isLoading,
    loadError,
    apiError,
    isSaving: updateMutation.isPending,
    handleChange,
    handleSubmit,
  };
}
