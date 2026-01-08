import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Inbox, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, Button, PaginationControls } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams, useErrorHandler } from '@/hooks';
import { OrganizacionRelacionDto, ListaPaginada } from '@/shared/types/api';
import { useAuthStore } from '@/store';
import { useLocalizationStore } from '@/store/localization.store';
import { formatDate } from '@/shared/utils/dateFormatter';
import { CrearRelacionModal } from '../components/CrearRelacionModal';
import { RelacionesTable } from '../components/RelacionesTable';
import { AsignarRecursosModal } from '../components/AsignarRecursosModal';
import { GestionarExclusionesModal } from '../components/GestionarExclusionesModal';
import { ResponderSolicitudModal } from '../components/ResponderSolicitudModal';

export function RelacionesOrganizacionPage() {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const organizacionId = useAuthStore((state) => state.organizationId);
  const { preferences } = useLocalizationStore();
  const culture = preferences?.culture ?? 'es-AR';
  const timeZoneId = preferences?.timeZoneId ?? 'America/Argentina/Buenos_Aires';

  // Datos
  const [relacionesData, setRelacionesData] = useState<ListaPaginada<OrganizacionRelacionDto> | null>(null);
  const [pendingRequests, setPendingRequests] = useState<OrganizacionRelacionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [relacionToRespond, setRelacionToRespond] = useState<OrganizacionRelacionDto | null>(null);
  const [relacionToAssignResources, setRelacionToAssignResources] = useState<string | null>(null);
  const [relacionToManageExclusions, setRelacionToManageExclusions] = useState<OrganizacionRelacionDto | null>(null);

  // Table State
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [relacionToDelete, setRelacionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can } = usePermissions();
  const canManage = can('usuarios:editar'); // TODO: Permission for relations?

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [relResult, pendingResult] = await Promise.all([
        organizacionesApi.listarRelacionesOrganizacion({
          ...paginationParams,
          soloActivas: true,
        }),
        organizacionesApi.obtenerSolicitudesPendientes()
      ]);

      setRelacionesData(relResult);
      setPendingRequests(pendingResult);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, getErrorMessage]);

  useEffect(() => {
    if (organizacionId) {
      loadData();
    }
  }, [loadData, organizacionId]);

  // Auto-ajustar página si excede el total (ej: después de eliminar registros)
  useEffect(() => {
    if (
      relacionesData &&
      relacionesData.totalPaginas > 0 &&
      relacionesData.paginaActual > relacionesData.totalPaginas
    ) {
      setNumeroPagina(relacionesData.totalPaginas);
    }
  }, [relacionesData, setNumeroPagina]);

  const handleDelete = async (relacionId: string) => {
    // Confirmation handled by RelacionesTable -> ConfirmationModal
    try {
      setIsDeleting(true);
      await organizacionesApi.eliminarRelacionOrganizacion(relacionId);
      await loadData();
      setRelacionToDelete(null); // Close modal
    } catch (err) {
      console.error('Error deleting relation:', err);
      // Optional: setError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const relaciones = relacionesData?.items ?? [];

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
            {t('organization.relations.title')}
          </h1>
          <p className="text-text-muted mt-1">
            {t('organization.relations.subtitle')}
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Link2 size={20} />
            {t('organization.relations.create.title')}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20">
          {error}
        </div>
      )}

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text flex items-center gap-2">
            <Inbox size={20} className="text-primary" />
            Solicitudes Pendientes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="border-l-4 border-l-warning">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                        {req.esSolicitante ? 'Enviada' : 'Recibida'}
                      </span>
                      <h4 className="font-medium text-text mt-1">
                        {req.esSolicitante ? req.destinoOrganizacionNombre : req.solicitanteOrganizacionNombre}
                      </h4>
                    </div>
                    {req.esSolicitante ? (
                      <ArrowRight size={18} className="text-text-muted" />
                    ) : (
                      <ArrowLeft size={18} className="text-success" />
                    )}
                  </div>

                  <div className="text-sm text-text-muted">
                    {formatDate(req.fechaCreacion, culture, timeZoneId)}
                  </div>

                  {!req.esSolicitante && canManage && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setRelacionToRespond(req)}
                    >
                      Gestionar Solicitud
                    </Button>
                  )}
                  {req.esSolicitante && (
                    <div className="text-xs text-text-muted italic text-center py-1">
                      Esperando respuesta...
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <RelacionesTable
          relaciones={relaciones}
          isLoading={isLoading}
          organizacionActualId={organizacionId}
          onDelete={canManage ? (id) => { handleDelete(id); } : undefined}
          onAssignResources={canManage ? setRelacionToAssignResources : undefined}
          onManageExclusions={canManage ? (id) => {
            const rel = relaciones.find(r => r.id === id);
            if (rel) setRelacionToManageExclusions(rel);
          } : undefined}
          actionMenuOpen={actionMenuOpen}
          setActionMenuOpen={setActionMenuOpen}
          relacionToDelete={relacionToDelete}
          setRelacionToDelete={setRelacionToDelete}
          isDeleting={isDeleting}
        />

        {relacionesData && (
          <PaginationControls
            paginaActual={relacionesData.paginaActual}
            totalPaginas={relacionesData.totalPaginas}
            onPageChange={setNumeroPagina}
            tamanoPagina={relacionesData.tamanoPagina}
            onPageSizeChange={setTamanoPagina}
            totalRegistros={relacionesData.totalRegistros}
          />
        )}
      </Card>

      <CrearRelacionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />

      {relacionToRespond && (
        <ResponderSolicitudModal
          isOpen={!!relacionToRespond}
          onClose={() => setRelacionToRespond(null)}
          onSuccess={loadData}
          solicitud={relacionToRespond}
        />
      )}

      {relacionToAssignResources && (
        <AsignarRecursosModal
          isOpen={!!relacionToAssignResources}
          onClose={() => setRelacionToAssignResources(null)}
          relacionId={relacionToAssignResources}
          organizacionActualId={organizacionId} // FIXED: organizacionActualId
          onSuccess={() => { }}
        />
      )}

      {relacionToManageExclusions && (
        <GestionarExclusionesModal
          isOpen={!!relacionToManageExclusions}
          onClose={() => setRelacionToManageExclusions(null)}
          relacionId={relacionToManageExclusions.id}
          organizacionContrariaNombre={ // FIXED: organizacionContrariaNombre
            relacionToManageExclusions.esSolicitante
              ? relacionToManageExclusions.destinoOrganizacionNombre
              : relacionToManageExclusions.solicitanteOrganizacionNombre
          }
          esOutbound={true} // DEFAULT: true (Managing my exclusions)
        />
      )}
    </div>
  );
}
