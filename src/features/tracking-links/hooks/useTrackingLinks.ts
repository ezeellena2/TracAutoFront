import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks';
import { useToastStore } from '@/store';
import { trackingLinksApi } from '../api';
import type {
  LinkTrackingDto,
  CrearLinkTrackingRequest,
  ExtenderLinkTrackingRequest,
} from '../types';

export type TrackingLinksTab = 'activos' | 'historico';

export interface UseTrackingLinksOptions {
  /** Filtrar por vehículo específico */
  vehiculoId?: string;
  /** Filtrar por reserva de alquiler */
  reservaAlquilerId?: string;
  /** Si es true no muestra acciones de crear/revocar/extender */
  readOnly?: boolean;
}

export function useTrackingLinks(options: UseTrackingLinksOptions = {}) {
  const { vehiculoId, reservaAlquilerId } = options;
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const toast = useToastStore();

  const [links, setLinks] = useState<LinkTrackingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<TrackingLinksTab>('activos');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<LinkTrackingDto | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [linkToExtend, setLinkToExtend] = useState<LinkTrackingDto | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [linkToShowQr, setLinkToShowQr] = useState<LinkTrackingDto | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await trackingLinksApi.listar({
        soloActivos: false,
        vehiculoId,
        reservaAlquilerId,
      });
      setLinks(result);
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, vehiculoId, reservaAlquilerId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const linksActivos = useMemo(
    () => links.filter((link) => link.activo && !link.estaExpirado),
    [links],
  );

  const linksHistoricos = useMemo(
    () => links.filter((link) => !link.activo || link.estaExpirado),
    [links],
  );

  const linksVisibles = useMemo(
    () => (tabActiva === 'activos' ? linksActivos : linksHistoricos),
    [linksActivos, linksHistoricos, tabActiva],
  );

  const handleCreate = useCallback(async (request: CrearLinkTrackingRequest) => {
    setIsCreating(true);
    try {
      // Si tenemos reservaAlquilerId en el contexto, adjuntarlo al request
      const enrichedRequest = reservaAlquilerId
        ? { ...request, reservaAlquilerId }
        : request;
      await trackingLinksApi.crear(enrichedRequest);
      toast.success(t('trackingLinks.creadoExito'));
      setIsCreateModalOpen(false);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsCreating(false);
    }
  }, [handleApiError, loadData, t, toast, reservaAlquilerId]);

  const handleOpenRevoke = useCallback((link: LinkTrackingDto) => {
    setLinkToRevoke(link);
    setIsRevokeModalOpen(true);
  }, []);

  const handleRevoke = useCallback(async () => {
    if (!linkToRevoke) return;
    setIsRevoking(true);
    try {
      await trackingLinksApi.revocar(linkToRevoke.id);
      toast.success(t('trackingLinks.revocadoExito'));
      setIsRevokeModalOpen(false);
      setLinkToRevoke(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsRevoking(false);
    }
  }, [linkToRevoke, handleApiError, loadData, t, toast]);

  const handleOpenExtend = useCallback((link: LinkTrackingDto) => {
    setLinkToExtend(link);
    setIsExtendModalOpen(true);
  }, []);

  const handleShowQr = useCallback((link: LinkTrackingDto) => {
    setLinkToShowQr(link);
    setIsQrModalOpen(true);
  }, []);

  const handleExtend = useCallback(async (request: ExtenderLinkTrackingRequest) => {
    if (!linkToExtend) return;
    setIsExtending(true);
    try {
      await trackingLinksApi.extender(linkToExtend.id, request);
      toast.success(t('trackingLinks.extendidoExito'));
      setIsExtendModalOpen(false);
      setLinkToExtend(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsExtending(false);
    }
  }, [linkToExtend, handleApiError, loadData, t, toast]);

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('trackingLinks.urlCopiada'));
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(t('trackingLinks.urlCopiada'));
    }
  }, [t, toast]);

  return {
    links,
    linksActivos,
    linksHistoricos,
    linksVisibles,
    isLoading,
    error,
    loadData,
    tabActiva,
    setTabActiva,

    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    handleCreate,

    // Revoke
    isRevokeModalOpen,
    setIsRevokeModalOpen,
    isRevoking,
    handleOpenRevoke,
    handleRevoke,

    // Extend
    isExtendModalOpen,
    setIsExtendModalOpen,
    isExtending,
    handleOpenExtend,
    handleExtend,

    // QR
    isQrModalOpen,
    setIsQrModalOpen,
    linkToShowQr,
    handleShowQr,

    // Utils
    handleCopyUrl,
  };
}
