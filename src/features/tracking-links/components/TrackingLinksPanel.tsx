import { useTranslation } from 'react-i18next';
import { Plus, Link2, History } from 'lucide-react';
import { PageLoader, EstadoVacio, EstadoError, ConfirmationModal } from '@/shared/ui';
import { useTrackingLinks } from '../hooks/useTrackingLinks';
import type { UseTrackingLinksOptions } from '../hooks/useTrackingLinks';
import { CrearLinkModal } from './CrearLinkModal';
import { ExtenderLinkModal } from './ExtenderLinkModal';
import { LinksTrackingTable } from './LinksTrackingTable';
import { LinkQrModal } from './LinkQrModal';

export interface TrackingLinksPanelProps extends UseTrackingLinksOptions {
  /** VehiculoId pre-seleccionado para la creación de links */
  vehiculoPreseleccionado?: string;
  /** Si es true, oculta el header con título */
  compact?: boolean;
}

/**
 * Panel embebible de tracking links. Se puede usar standalone o dentro de otros módulos
 * (alquileres, telemática, marketplace) pasando filtros como props.
 */
export function TrackingLinksPanel({
  vehiculoId,
  reservaAlquilerId,
  readOnly = false,
  vehiculoPreseleccionado,
  compact = false,
}: TrackingLinksPanelProps) {
  const { t } = useTranslation();
  const {
    links,
    linksActivos,
    linksHistoricos,
    linksVisibles,
    isLoading,
    error,
    loadData,
    tabActiva,
    setTabActiva,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    handleCreate,
    isRevokeModalOpen,
    setIsRevokeModalOpen,
    isRevoking,
    handleOpenRevoke,
    handleRevoke,
    isExtendModalOpen,
    setIsExtendModalOpen,
    isExtending,
    handleOpenExtend,
    handleExtend,
    isQrModalOpen,
    setIsQrModalOpen,
    linkToShowQr,
    handleShowQr,
    handleCopyUrl,
  } = useTrackingLinks({ vehiculoId, reservaAlquilerId, readOnly });

  if (isLoading && links.length === 0) {
    return <PageLoader />;
  }

  if (error) {
    return <EstadoError mensaje={error} onReintentar={loadData} />;
  }

  const isTabActivos = tabActiva === 'activos';
  const emptyStateTitle = isTabActivos
    ? links.length === 0
      ? t('trackingLinks.sinLinks')
      : t('trackingLinks.sinLinksActivos')
    : t('trackingLinks.sinLinksHistorico');
  const emptyStateDescription = isTabActivos
    ? links.length === 0
      ? t('trackingLinks.sinLinksDescripcion')
      : t('trackingLinks.sinLinksActivosDescripcion')
    : t('trackingLinks.sinLinksHistoricoDescripcion');
  const sectionTitle = isTabActivos
    ? t('trackingLinks.lista')
    : t('trackingLinks.listaHistorico');

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">{t('trackingLinks.titulo')}</h2>
            <p className="text-sm text-text-muted mt-0.5">{t('trackingLinks.subtitulo')}</p>
          </div>
          {!readOnly && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              {t('trackingLinks.crear')}
            </button>
          )}
        </div>
      )}

      {/* Compact header with just create button */}
      {compact && !readOnly && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            {t('trackingLinks.crear')}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <div className="flex bg-background border border-border rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={isTabActivos}
            onClick={() => setTabActiva('activos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isTabActivos ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <Link2 size={14} />
            {t('trackingLinks.tabs.activos')}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isTabActivos ? 'bg-primary/10 text-primary' : 'bg-border text-text-muted'
            }`}>
              {linksActivos.length}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={!isTabActivos}
            onClick={() => setTabActiva('historico')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isTabActivos ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <History size={14} />
            {t('trackingLinks.tabs.historico')}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              !isTabActivos ? 'bg-primary/10 text-primary' : 'bg-border text-text-muted'
            }`}>
              {linksHistoricos.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {linksVisibles.length === 0 ? (
        <EstadoVacio
          titulo={emptyStateTitle}
          descripcion={emptyStateDescription}
          icono={<Link2 size={48} className="text-text-muted" />}
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="text-base font-semibold text-text">{sectionTitle}</h3>
          </div>
          <LinksTrackingTable
            links={linksVisibles}
            onCopyUrl={handleCopyUrl}
            onRevoke={readOnly ? () => {} : handleOpenRevoke}
            onExtend={readOnly ? () => {} : handleOpenExtend}
            onShowQr={handleShowQr}
          />
        </div>
      )}

      {/* Modals */}
      {!readOnly && (
        <>
          <CrearLinkModal
            isOpen={isCreateModalOpen}
            isLoading={isCreating}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreate}
            vehiculoIdPreseleccionado={vehiculoPreseleccionado ?? vehiculoId}
          />

          <ExtenderLinkModal
            isOpen={isExtendModalOpen}
            isLoading={isExtending}
            onClose={() => setIsExtendModalOpen(false)}
            onSubmit={handleExtend}
          />

          <ConfirmationModal
            isOpen={isRevokeModalOpen}
            title={t('trackingLinks.revocar')}
            description={t('trackingLinks.revocarConfirmar')}
            isLoading={isRevoking}
            onConfirm={handleRevoke}
            onClose={() => setIsRevokeModalOpen(false)}
            variant="danger"
          />
        </>
      )}

      <LinkQrModal
        link={linkToShowQr}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
