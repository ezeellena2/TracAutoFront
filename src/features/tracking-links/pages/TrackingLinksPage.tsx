import { useTranslation } from 'react-i18next';
import { Plus, Link2, History } from 'lucide-react';
import { PageLoader, EstadoVacio, EstadoError, ConfirmationModal } from '@/shared/ui';
import { useTrackingLinksPage } from '../hooks/useTrackingLinksPage';
import { CrearLinkModal } from '../components/CrearLinkModal';
import { ExtenderLinkModal } from '../components/ExtenderLinkModal';
import { LinksTrackingTable } from '../components/LinksTrackingTable';
import { LinkQrModal } from '../components/LinkQrModal';

export function TrackingLinksPage() {
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
  } = useTrackingLinksPage();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('trackingLinks.titulo')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('trackingLinks.subtitulo')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          {t('trackingLinks.crear')}
        </button>
      </div>

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
            <h2 className="text-lg font-semibold text-text">{sectionTitle}</h2>
          </div>
          <LinksTrackingTable
            links={linksVisibles}
            onCopyUrl={handleCopyUrl}
            onRevoke={handleOpenRevoke}
            onExtend={handleOpenExtend}
            onShowQr={handleShowQr}
          />
        </div>
      )}

      {/* Modals */}
      <CrearLinkModal
        isOpen={isCreateModalOpen}
        isLoading={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
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

      <LinkQrModal
        link={linkToShowQr}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
