import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Card, PaginationControls, Button, ConfirmationModal, Modal } from '@/shared/ui';
import { solicitudesCambioApi } from '@/services/endpoints';
import { usePaginationParams, useErrorHandler } from '@/hooks';
import { useAuthStore } from '@/store';
import { SolicitudCambioDto, EstadoSolicitudCambio } from '@/shared/types/api';
import { SolicitudesCambioTable } from '../components/SolicitudesCambioTable';
import { SolicitudCambioModal } from '@/features/solicitudes-cambio/components/SolicitudCambioModal';
import { useSolicitudesCambio } from '../hooks/useSolicitudesCambio';
import { toast } from '@/store/toast.store';

export function SolicitudesCambioPage() {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const organizacionId = useAuthStore((state) => state.organizationId);

  // Pagination
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams,
  } = usePaginationParams({ initialPageSize: 10 });

  // Modal state
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCambioDto | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showBorrarModal, setShowBorrarModal] = useState<SolicitudCambioDto | null>(null);
  const [nuevaSolicitudDescripcion, setNuevaSolicitudDescripcion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data
  const { data, isLoading, error, refetch } = useSolicitudesCambio({
    ...paginationParams,
  });

  // Auto-ajustar página si excede el total
  const totalPaginas = data?.totalPaginas ?? 0;
  const paginaActual = data?.paginaActual ?? 1;

  useEffect(() => {
    if (totalPaginas > 0 && paginaActual > totalPaginas) {
      setNumeroPagina(totalPaginas);
    }
  }, [totalPaginas, paginaActual, setNumeroPagina]);

  const handleCrearSolicitud = async () => {
    if (!nuevaSolicitudDescripcion.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      const nuevaSolicitud = await solicitudesCambioApi.crear({
        route: null,
        crKey: 'generic',
        label: 'Solicitud Genérica',
        entityType: null,
        entityId: null,
        mensajeInicial: nuevaSolicitudDescripcion.trim(),
      });

      toast.success(t('solicitudesCambio.crear.success') || 'Solicitud creada exitosamente');
      setShowCrearModal(false);
      setNuevaSolicitudDescripcion('');
      setSelectedSolicitud(nuevaSolicitud);
      refetch();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setErrorDetalle(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBorrarSolicitud = async (forceDelete: boolean = false) => {
    if (!showBorrarModal) return;

    try {
      setIsDeleting(true);
      await solicitudesCambioApi.borrar(showBorrarModal.id, forceDelete);
      toast.success(t('solicitudesCambio.borrar.success') || 'Solicitud borrada exitosamente');
      setShowBorrarModal(null);
      refetch();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setErrorDetalle(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const solicitudes = data?.items ?? [];

  if (!organizacionId) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-4 text-center text-text-muted">
            {t('common.error.noOrganization')}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t('solicitudesCambio.title')}
          </h1>
          <p className="text-text-muted mt-1">
            {t('solicitudesCambio.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowCrearModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          {t('solicitudesCambio.actions.nuevaSolicitud')}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20">
          {getErrorMessage(error)}
        </div>
      )}

      {errorDetalle && (
        <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20">
          {errorDetalle}
        </div>
      )}

      <Card>
        <SolicitudesCambioTable
          solicitudes={solicitudes}
          isLoading={isLoading}
          onViewDetails={(solicitud) => {
            setErrorDetalle(null);
            // Obtener solicitud completa con mensajes
            solicitudesCambioApi.obtener(solicitud.id)
              .then((fullSolicitud) => {
                setSelectedSolicitud(fullSolicitud);
              })
              .catch((err) => {
                // Usar getErrorMessage para obtener mensaje seguro sin exponer detalles sensibles
                const errorMessage = getErrorMessage(err);
                setErrorDetalle(errorMessage);
              });
          }}
          onDelete={(solicitud) => {
            setShowBorrarModal(solicitud);
          }}
          actionMenuOpen={actionMenuOpen}
          setActionMenuOpen={setActionMenuOpen}
        />

        {data && (
          <PaginationControls
            paginaActual={data.paginaActual}
            totalPaginas={data.totalPaginas}
            onPageChange={setNumeroPagina}
            tamanoPagina={data.tamanoPagina}
            onPageSizeChange={setTamanoPagina}
            totalRegistros={data.totalRegistros}
          />
        )}
      </Card>

      {selectedSolicitud && (
        <SolicitudCambioModal
          isOpen={!!selectedSolicitud}
          onClose={() => {
            setSelectedSolicitud(null);
            setErrorDetalle(null);
            refetch(); // Refresh list after closing modal
          }}
          contexto={{
            route: selectedSolicitud.route ?? '',
            crKey: selectedSolicitud.crKey ?? '',
            label: selectedSolicitud.label ?? '',
            entityType: undefined,
            entityId: undefined,
          }}
          solicitudId={selectedSolicitud.id}
        />
      )}

      {/* Modal para crear nueva solicitud */}
      <Modal
        isOpen={showCrearModal}
        onClose={() => {
          setShowCrearModal(false);
          setNuevaSolicitudDescripcion('');
        }}
        title={t('solicitudesCambio.crear.title')}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-text-muted mb-4">
            {t('solicitudesCambio.crear.description')}
          </p>
          <textarea
            value={nuevaSolicitudDescripcion}
            onChange={(e) => setNuevaSolicitudDescripcion(e.target.value)}
            placeholder={t('solicitudesCambio.crear.placeholder')}
            rows={6}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCrearModal(false);
                setNuevaSolicitudDescripcion('');
              }}
              disabled={isCreating}
            >
              {t('solicitudesCambio.crear.cancelar')}
            </Button>
            <Button
              onClick={handleCrearSolicitud}
              isLoading={isCreating}
              disabled={!nuevaSolicitudDescripcion.trim()}
            >
              {t('solicitudesCambio.crear.crear')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para borrar */}
      {showBorrarModal && (
        <ConfirmationModal
          isOpen={!!showBorrarModal}
          onClose={() => setShowBorrarModal(null)}
          onConfirm={() => {
            const forceDelete = showBorrarModal.estado === EstadoSolicitudCambio.Exported;
            handleBorrarSolicitud(forceDelete);
          }}
          title={t('solicitudesCambio.borrar.title')}
          description={
            showBorrarModal.estado === EstadoSolicitudCambio.Exported
              ? t('solicitudesCambio.borrar.descriptionExported')
              : t('solicitudesCambio.borrar.description')
          }
          confirmText={t('solicitudesCambio.borrar.confirmar')}
          cancelText={t('solicitudesCambio.borrar.cancelar')}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
