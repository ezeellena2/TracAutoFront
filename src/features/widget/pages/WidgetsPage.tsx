import { useTranslation } from 'react-i18next';
import { Plus, Blocks, Code2, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { PageLoader, EstadoVacio, EstadoError, ConfirmationModal } from '@/shared/ui';
import { useWidgetsPage } from '../hooks/useWidgetsPage';
import { WidgetFormModal } from '../components/WidgetFormModal';
import { WidgetEmbedModal } from '../components/WidgetEmbedModal';
import { TipoWidget } from '../types';

const TIPO_WIDGET_LABELS: Record<TipoWidget, string> = {
  [TipoWidget.MapaFlota]: 'widget.tipos.mapaFlota',
  [TipoWidget.TrackingVehiculo]: 'widget.tipos.trackingVehiculo',
  [TipoWidget.EstadoReserva]: 'widget.tipos.estadoReserva',
  [TipoWidget.FlotaResumen]: 'widget.tipos.flotaResumen',
};

export function WidgetsPage() {
  const { t } = useTranslation();
  const {
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
  } = useWidgetsPage();

  if (isLoading && widgets.length === 0) {
    return <PageLoader />;
  }

  if (error) {
    return <EstadoError mensaje={error} onReintentar={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('widget.titulo')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('widget.subtitulo')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          {t('widget.crear')}
        </button>
      </div>

      {/* Content */}
      {widgets.length === 0 ? (
        <EstadoVacio
          titulo={t('widget.sinWidgets')}
          descripcion={t('widget.sinWidgetsDescripcion')}
          icono={<Blocks size={48} className="text-text-muted" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map(widget => (
            <div
              key={widget.id}
              className="bg-surface rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Blocks size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text text-sm">{widget.nombre}</h3>
                    <span className="text-xs text-text-muted">
                      {t(TIPO_WIDGET_LABELS[widget.tipoWidget])}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  widget.activo
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {widget.activo ? t('widget.activo') : t('widget.inactivo')}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-background-secondary rounded-lg p-2">
                  <p className="text-xs text-text-muted">{t('widget.totalAccesos')}</p>
                  <p className="text-sm font-semibold text-text">
                    {widget.totalAccesos.toLocaleString()}
                  </p>
                </div>
                <div className="bg-background-secondary rounded-lg p-2">
                  <p className="text-xs text-text-muted">{t('widget.dominios')}</p>
                  <p className="text-sm font-semibold text-text">
                    {widget.dominiosPermitidos.length}
                  </p>
                </div>
              </div>

              {/* Last Access */}
              {widget.ultimoAcceso && (
                <p className="text-xs text-text-muted mb-3">
                  {t('widget.ultimoAcceso')}: {new Date(widget.ultimoAcceso).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <button
                  onClick={() => handleOpenEmbed(widget.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  title={t('widget.verCodigo')}
                >
                  <Code2 size={14} />
                  {t('widget.embed.codigo')}
                </button>
                <button
                  onClick={() => handleOpenEdit(widget.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover transition-colors"
                  title={t('common.editar')}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleOpenRegenerate(widget.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover transition-colors"
                  title={t('widget.regenerarApiKey')}
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => handleOpenDelete(widget.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                  title={t('common.eliminar')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <WidgetFormModal
        isOpen={isCreateModalOpen}
        isLoading={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <WidgetFormModal
        isOpen={isEditModalOpen}
        isLoading={isUpdating}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={() => {}}
        onUpdate={handleUpdate}
        editData={selectedWidget}
      />

      <WidgetEmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        widget={selectedWidget}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('widget.desactivar')}
        description={t('widget.desactivarConfirmar')}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isRegenerateModalOpen}
        title={t('widget.regenerarApiKey')}
        description={t('widget.regenerarApiKeyConfirmar')}
        isLoading={isRegenerating}
        onConfirm={handleRegenerate}
        onClose={() => setIsRegenerateModalOpen(false)}
        variant="warning"
      />
    </div>
  );
}
