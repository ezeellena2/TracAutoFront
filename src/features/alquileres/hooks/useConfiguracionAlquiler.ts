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
  enviarRecordatoriosRecogida: boolean;
  horasAnticipacionRecordatorioRecogida: string;
  enviarRecordatoriosDevolucion: boolean;
  horasAnticipacionRecordatorioDevolucion: string;
  enviarRecordatoriosVencimientoDocumentos: boolean;
  diasAnticipacionRecordatorioDocumentos: string;
  enviarRecordatoriosVencimientoLicenciasClientes: boolean;
  enviarRecordatoriosVencimientoVtvVehiculos: boolean;
  enviarRecordatoriosVencimientoSeguroVehiculos: boolean;
  enviarRecordatoriosVencimientoPolizaVehiculos: boolean;
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
  enviarLinkTrackingAlConfirmar: boolean;
  duracionLinkTrackingHoras: string;
  alertarStockOciosoHabilitado: boolean;
  diasAnticipacionStockOcioso: string;
  umbralMinimoVehiculosOciosos: string;
  sugerenciaRotacionHabilitada: boolean;
  aniosFlotaParaRotarAMarketplace: string;
  kilometrajeLimiteParaRotarAMarketplace: string;
  diasPublicacionSinVentaParaRotarAAlquiler: string;
  ajusteAutomaticoTarifasHabilitado: boolean;
  indiceAjusteTarifas: string;
  porcentajeAjusteMaximo: string;
  diaDelMesAjuste: string;
}

export interface ConfigFormErrors {
  horasAnticipacionRecordatorioRecogida?: string;
  horasAnticipacionRecordatorioDevolucion?: string;
  diasAnticipacionRecordatorioDocumentos?: string;
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
  enviarRecordatoriosRecogida: true,
  horasAnticipacionRecordatorioRecogida: '24',
  enviarRecordatoriosDevolucion: true,
  horasAnticipacionRecordatorioDevolucion: '24',
  enviarRecordatoriosVencimientoDocumentos: true,
  diasAnticipacionRecordatorioDocumentos: '30, 15, 7',
  enviarRecordatoriosVencimientoLicenciasClientes: true,
  enviarRecordatoriosVencimientoVtvVehiculos: false,
  enviarRecordatoriosVencimientoSeguroVehiculos: false,
  enviarRecordatoriosVencimientoPolizaVehiculos: false,
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
  enviarLinkTrackingAlConfirmar: false,
  duracionLinkTrackingHoras: '48',
  alertarStockOciosoHabilitado: false,
  diasAnticipacionStockOcioso: '0',
  umbralMinimoVehiculosOciosos: '0',
  sugerenciaRotacionHabilitada: false,
  aniosFlotaParaRotarAMarketplace: '3',
  kilometrajeLimiteParaRotarAMarketplace: '100000',
  diasPublicacionSinVentaParaRotarAAlquiler: '60',
  ajusteAutomaticoTarifasHabilitado: false,
  indiceAjusteTarifas: '',
  porcentajeAjusteMaximo: '20',
  diaDelMesAjuste: '1',
};

function parseDiasAnticipacion(raw: string): number[] {
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function validateReminderHours(value: string): boolean {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 720;
}

function validateForm(form: ConfigFormState, t: (key: string) => string): ConfigFormErrors {
  const errors: ConfigFormErrors = {};

  if (!validateReminderHours(form.horasAnticipacionRecordatorioRecogida)) {
    errors.horasAnticipacionRecordatorioRecogida = t('alquileres.configuracion.errores.horasRecordatorioRango');
  }

  if (!validateReminderHours(form.horasAnticipacionRecordatorioDevolucion)) {
    errors.horasAnticipacionRecordatorioDevolucion = t('alquileres.configuracion.errores.horasRecordatorioRango');
  }

  const diasDocumentos = parseDiasAnticipacion(form.diasAnticipacionRecordatorioDocumentos);
  const diasUnicos = new Set(diasDocumentos);
  const diasTokens = form.diasAnticipacionRecordatorioDocumentos
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (
    diasDocumentos.length === 0 ||
    diasDocumentos.length !== diasTokens.length ||
    diasDocumentos.length > 10 ||
    diasDocumentos.some((dia) => dia < 1 || dia > 365) ||
    diasUnicos.size !== diasDocumentos.length
  ) {
    errors.diasAnticipacionRecordatorioDocumentos = t('alquileres.configuracion.errores.diasDocumentosInvalidos');
  }

  const senal = Number(form.porcentajeSenal);
  if (Number.isNaN(senal) || senal < 0 || senal > 100) {
    errors.porcentajeSenal = t('alquileres.configuracion.errores.porcentaje0a100');
  }

  if (!Object.values(PoliticaCancelacion).includes(form.politicaCancelacion)) {
    errors.politicaCancelacion = t('alquileres.configuracion.errores.politicaInvalida');
  }

  const dias = Number(form.diasAntesCancelacionGratis);
  if (Number.isNaN(dias) || dias < 0 || !Number.isInteger(dias)) {
    errors.diasAntesCancelacionGratis = t('alquileres.configuracion.errores.diasMinimo0');
  }

  const penalizacion = Number(form.porcentajePenalizacion);
  if (Number.isNaN(penalizacion) || penalizacion < 0 || penalizacion > 100) {
    errors.porcentajePenalizacion = t('alquileres.configuracion.errores.porcentaje0a100');
  }

  if (!form.monedaPorDefecto.trim()) {
    errors.monedaPorDefecto = t('alquileres.configuracion.errores.monedaRequerida');
  } else if (form.monedaPorDefecto.trim().length > 3) {
    errors.monedaPorDefecto = t('alquileres.configuracion.errores.monedaMax3');
  }

  const horas = Number(form.horasExpiracionTentativa);
  if (Number.isNaN(horas) || horas <= 0 || !Number.isInteger(horas)) {
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
  if (Number.isNaN(precioLitro) || precioLitro < 0) {
    errors.precioPorLitroCombustible = t('alquileres.configuracion.errores.precioMinimo0');
  }

  const precioHora = Number(form.precioPorHoraExtra);
  if (Number.isNaN(precioHora) || precioHora < 0) {
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
        enviarRecordatoriosRecogida: data.enviarRecordatoriosRecogida,
        horasAnticipacionRecordatorioRecogida: String(data.horasAnticipacionRecordatorioRecogida),
        enviarRecordatoriosDevolucion: data.enviarRecordatoriosDevolucion,
        horasAnticipacionRecordatorioDevolucion: String(data.horasAnticipacionRecordatorioDevolucion),
        enviarRecordatoriosVencimientoDocumentos: data.enviarRecordatoriosVencimientoDocumentos,
        diasAnticipacionRecordatorioDocumentos: data.diasAnticipacionRecordatorioDocumentos.join(', '),
        enviarRecordatoriosVencimientoLicenciasClientes: data.enviarRecordatoriosVencimientoLicenciasClientes,
        enviarRecordatoriosVencimientoVtvVehiculos: data.enviarRecordatoriosVencimientoVtvVehiculos,
        enviarRecordatoriosVencimientoSeguroVehiculos: data.enviarRecordatoriosVencimientoSeguroVehiculos,
        enviarRecordatoriosVencimientoPolizaVehiculos: data.enviarRecordatoriosVencimientoPolizaVehiculos,
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
        enviarLinkTrackingAlConfirmar: data.enviarLinkTrackingAlConfirmar,
        duracionLinkTrackingHoras: String(data.duracionLinkTrackingHoras),
        alertarStockOciosoHabilitado: data.alertarStockOciosoHabilitado,
        diasAnticipacionStockOcioso: String(data.diasAnticipacionStockOcioso),
        umbralMinimoVehiculosOciosos: String(data.umbralMinimoVehiculosOciosos),
        sugerenciaRotacionHabilitada: data.sugerenciaRotacionHabilitada,
        aniosFlotaParaRotarAMarketplace: String(data.aniosFlotaParaRotarAMarketplace),
        kilometrajeLimiteParaRotarAMarketplace: String(data.kilometrajeLimiteParaRotarAMarketplace),
        diasPublicacionSinVentaParaRotarAAlquiler: String(data.diasPublicacionSinVentaParaRotarAAlquiler),
        ajusteAutomaticoTarifasHabilitado: data.ajusteAutomaticoTarifasHabilitado,
        indiceAjusteTarifas: data.indiceAjusteTarifas ?? '',
        porcentajeAjusteMaximo: String(data.porcentajeAjusteMaximo),
        diaDelMesAjuste: String(data.diaDelMesAjuste),
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateConfiguracionAlquilerRequest) => configuracionAlquilerApi.update(data),
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

  const handleChange = useCallback((field: keyof ConfigFormState, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(() => {
    const validationErrors = validateForm(form, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const request: UpdateConfiguracionAlquilerRequest = {
      enviarRecordatoriosRecogida: form.enviarRecordatoriosRecogida,
      horasAnticipacionRecordatorioRecogida: Number(form.horasAnticipacionRecordatorioRecogida),
      enviarRecordatoriosDevolucion: form.enviarRecordatoriosDevolucion,
      horasAnticipacionRecordatorioDevolucion: Number(form.horasAnticipacionRecordatorioDevolucion),
      enviarRecordatoriosVencimientoDocumentos: form.enviarRecordatoriosVencimientoDocumentos,
      diasAnticipacionRecordatorioDocumentos: parseDiasAnticipacion(form.diasAnticipacionRecordatorioDocumentos),
      enviarRecordatoriosVencimientoLicenciasClientes: form.enviarRecordatoriosVencimientoLicenciasClientes,
      enviarRecordatoriosVencimientoVtvVehiculos: form.enviarRecordatoriosVencimientoVtvVehiculos,
      enviarRecordatoriosVencimientoSeguroVehiculos: form.enviarRecordatoriosVencimientoSeguroVehiculos,
      enviarRecordatoriosVencimientoPolizaVehiculos: form.enviarRecordatoriosVencimientoPolizaVehiculos,
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
      enviarLinkTrackingAlConfirmar: form.enviarLinkTrackingAlConfirmar,
      duracionLinkTrackingHoras: Number(form.duracionLinkTrackingHoras),
      alertarStockOciosoHabilitado: form.alertarStockOciosoHabilitado,
      diasAnticipacionStockOcioso: Number(form.diasAnticipacionStockOcioso),
      umbralMinimoVehiculosOciosos: Number(form.umbralMinimoVehiculosOciosos),
      sugerenciaRotacionHabilitada: form.sugerenciaRotacionHabilitada,
      aniosFlotaParaRotarAMarketplace: Number(form.aniosFlotaParaRotarAMarketplace),
      kilometrajeLimiteParaRotarAMarketplace: Number(form.kilometrajeLimiteParaRotarAMarketplace),
      diasPublicacionSinVentaParaRotarAAlquiler: Number(form.diasPublicacionSinVentaParaRotarAAlquiler),
      ajusteAutomaticoTarifasHabilitado: form.ajusteAutomaticoTarifasHabilitado,
      indiceAjusteTarifas: form.indiceAjusteTarifas.trim() || null,
      porcentajeAjusteMaximo: Number(form.porcentajeAjusteMaximo),
      diaDelMesAjuste: Number(form.diaDelMesAjuste),
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
