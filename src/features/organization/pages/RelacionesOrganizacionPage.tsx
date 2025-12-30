import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import { Card, Button, PaginationControls } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams, useErrorHandler } from '@/hooks';
import { OrganizacionRelacionDto, ListaPaginada } from '@/shared/types/api';
import { useAuthStore } from '@/store';
import { CrearRelacionModal } from '../components/CrearRelacionModal';
import { RelacionesTable } from '../components/RelacionesTable';
import { AsignarRecursosModal } from '../components/AsignarRecursosModal';

export function RelacionesOrganizacionPage() {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const organizacionId = useAuthStore((state) => state.organizationId);
  
  // Datos paginados
  const [relacionesData, setRelacionesData] = useState<ListaPaginada<OrganizacionRelacionDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de paginación reutilizable
  const { 
    setNumeroPagina, 
    setTamanoPagina, 
    params: paginationParams 
  } = usePaginationParams({ initialPageSize: 10 });
  
  // Modales y estado de UI
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [relacionToDelete, setRelacionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relacionToAssignResources, setRelacionToAssignResources] = useState<string | null>(null);
  const { can } = usePermissions();

  // Permisos específicos para acciones de relaciones (solo Admin)
  const canManage = can('usuarios:editar'); // Usar mismo permiso que usuarios por ahora

  const loadRelaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await organizacionesApi.listarRelacionesOrganizacion({
        ...paginationParams,
        soloActivas: true, // Por defecto solo mostrar activas
      });
      setRelacionesData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, getErrorMessage]);

  // Refetch cuando cambian los parámetros de paginación
  useEffect(() => {
    if (organizacionId) {
      loadRelaciones();
    }
  }, [loadRelaciones, organizacionId]);

  const handleDelete = async (relacionId: string) => {
    try {
      setIsDeleting(true);
      await organizacionesApi.eliminarRelacionOrganizacion(relacionId);
      await loadRelaciones();
      setRelacionToDelete(null);
    } catch (err) {
      console.error('Error deleting relation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Extraer items para la tabla (vacío si no hay datos)
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
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                <Link2 size={24} />
                {t('organization.relations.title')}
              </h1>
              <p className="text-text-muted mt-1">
                {t('organization.relations.subtitle')}
              </p>
            </div>
            {canManage && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
              >
                {t('organization.relations.create.title')}
              </Button>
            )}
          </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-text-muted">
            {t('common.loading')}...
          </div>
        ) : relaciones.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            {t('organization.relations.empty')}
          </div>
        ) : (
          <div className="px-6 pb-6">
            <RelacionesTable
              relaciones={relaciones}
              organizacionActualId={organizacionId}
              onDelete={handleDelete}
              onAssignResources={(relacionId) => setRelacionToAssignResources(relacionId)}
              actionMenuOpen={actionMenuOpen}
              setActionMenuOpen={setActionMenuOpen}
              relacionToDelete={relacionToDelete}
              setRelacionToDelete={setRelacionToDelete}
              isDeleting={isDeleting}
            />

            {relacionesData && (
              <div className="mt-4 pt-4 border-t border-border">
                <PaginationControls
                  paginaActual={relacionesData.paginaActual}
                  totalPaginas={relacionesData.totalPaginas}
                  totalRegistros={relacionesData.totalRegistros}
                  tamanoPagina={relacionesData.tamanoPagina}
                  onPageChange={setNumeroPagina}
                  onPageSizeChange={setTamanoPagina}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </Card>

      <CrearRelacionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadRelaciones}
        organizacionActualId={organizacionId}
      />

      {relacionToAssignResources && (
        <AsignarRecursosModal
          isOpen={relacionToAssignResources !== null}
          onClose={() => setRelacionToAssignResources(null)}
          onSuccess={loadRelaciones}
          relacionId={relacionToAssignResources}
          organizacionActualId={organizacionId}
        />
      )}
    </div>
  );
}

