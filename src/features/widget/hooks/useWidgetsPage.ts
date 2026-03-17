import { useState, useCallback, useEffect } from 'react';
import { widgetApi } from '../api/widget.api';
import type {
  WidgetConfiguracionDto,
  WidgetConfiguracionConApiKeyDto,
  CrearWidgetRequest,
  ActualizarWidgetRequest,
} from '../types';
import { useErrorHandler } from '@/hooks';

export function useWidgetsPage() {
  const { handleApiError } = useErrorHandler();
  const [widgets, setWidgets] = useState<WidgetConfiguracionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  // Selected widget
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfiguracionConApiKeyDto | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await widgetApi.listar();
      setWidgets(data);
    } catch (err) {
      const parsed = handleApiError(err, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = useCallback(async (request: CrearWidgetRequest) => {
    setIsCreating(true);
    try {
      const created = await widgetApi.crear(request);
      setSelectedWidget(created);
      setIsCreateModalOpen(false);
      setIsEmbedModalOpen(true);
      await loadData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsCreating(false);
    }
  }, [loadData, handleApiError]);

  const handleUpdate = useCallback(async (id: string, request: ActualizarWidgetRequest) => {
    setIsUpdating(true);
    try {
      await widgetApi.actualizar(id, request);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsUpdating(false);
    }
  }, [loadData, handleApiError]);

  const handleOpenEdit = useCallback(async (id: string) => {
    try {
      const widget = await widgetApi.obtenerPorId(id);
      setSelectedWidget(widget);
      setIsEditModalOpen(true);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const handleOpenDelete = useCallback((id: string) => {
    setSelectedWidgetId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedWidgetId) return;
    setIsDeleting(true);
    try {
      await widgetApi.desactivar(selectedWidgetId);
      setIsDeleteModalOpen(false);
      setSelectedWidgetId(null);
      await loadData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedWidgetId, loadData, handleApiError]);

  const handleOpenEmbed = useCallback(async (id: string) => {
    try {
      const widget = await widgetApi.obtenerPorId(id);
      setSelectedWidget(widget);
      setIsEmbedModalOpen(true);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const handleOpenRegenerate = useCallback((id: string) => {
    setSelectedWidgetId(id);
    setIsRegenerateModalOpen(true);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (!selectedWidgetId) return;
    setIsRegenerating(true);
    try {
      const updated = await widgetApi.regenerarApiKey(selectedWidgetId);
      setSelectedWidget(updated);
      setIsRegenerateModalOpen(false);
      setIsEmbedModalOpen(true);
      await loadData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsRegenerating(false);
    }
  }, [selectedWidgetId, loadData, handleApiError]);

  const handleCopyApiKey = useCallback((apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
  }, []);

  return {
    widgets,
    isLoading,
    error,
    loadData,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    handleCreate,
    isEditModalOpen,
    setIsEditModalOpen,
    isUpdating,
    handleUpdate,
    handleOpenEdit,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    handleOpenDelete,
    handleDelete,
    isEmbedModalOpen,
    setIsEmbedModalOpen,
    handleOpenEmbed,
    isRegenerateModalOpen,
    setIsRegenerateModalOpen,
    isRegenerating,
    handleOpenRegenerate,
    handleRegenerate,
    selectedWidget,
    handleCopyApiKey,
  };
}
