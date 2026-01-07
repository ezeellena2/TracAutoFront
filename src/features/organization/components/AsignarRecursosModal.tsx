import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Check, Share2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Button, Input, Badge } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { toast } from '@/store';
import { useErrorHandler } from '@/hooks';
import {
  TipoRecurso,
  EstadoComparticion,
  RecursoCompartibleDto,
  RecursosCompartiblesResponse,
} from '@/shared/types/api';

interface AsignarRecursosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relacionId: string;
  organizacionActualId: string;
}

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 400;

export function AsignarRecursosModal({
  isOpen,
  onClose,
  onSuccess,
  relacionId,
}: AsignarRecursosModalProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();

  // Estado de UI
  const [activeTab, setActiveTab] = useState<TipoRecurso>(TipoRecurso.Vehiculo);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Estado de datos
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<RecursosCompartiblesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recursos seleccionados (por tipo)
  const [selectedByType, setSelectedByType] = useState<Record<TipoRecurso, Set<string>>>({
    [TipoRecurso.Vehiculo]: new Set(),
    [TipoRecurso.Conductor]: new Set(),
    [TipoRecurso.DispositivoTraccar]: new Set(),
  });

  // Debounce para busqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset page on search
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar datos cuando cambian los filtros
  const loadData = useCallback(async () => {
    if (!isOpen || !relacionId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await organizacionesApi.getRecursosCompartibles(relacionId, {
        resourceType: activeTab,
        numeroPagina: currentPage,
        tamanoPagina: PAGE_SIZE,
        buscar: debouncedSearch || undefined,
      });

      setData(response);
    } catch (err) {
      console.error('Error loading recursos:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, relacionId, activeTab, currentPage, debouncedSearch, getErrorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset state cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab(TipoRecurso.Vehiculo);
      setSearchTerm('');
      setDebouncedSearch('');
      setCurrentPage(1);
      setSelectedByType({
        [TipoRecurso.Vehiculo]: new Set(),
        [TipoRecurso.Conductor]: new Set(),
        [TipoRecurso.DispositivoTraccar]: new Set(),
      });
      setError(null);
    }
  }, [isOpen]);

  // Reset page cuando cambia el tab
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setDebouncedSearch('');
  }, [activeTab]);

  const handleToggleResource = (recurso: RecursoCompartibleDto) => {
    // Solo permitir seleccionar recursos disponibles
    if (recurso.estado !== EstadoComparticion.Disponible) return;

    setSelectedByType((prev) => {
      const newSet = new Set(prev[activeTab]);
      if (newSet.has(recurso.id)) {
        newSet.delete(recurso.id);
      } else {
        newSet.add(recurso.id);
      }
      return { ...prev, [activeTab]: newSet };
    });
  };

  const getTotalSelected = () => {
    return (
      selectedByType[TipoRecurso.Vehiculo].size +
      selectedByType[TipoRecurso.Conductor].size +
      selectedByType[TipoRecurso.DispositivoTraccar].size
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalSelected = getTotalSelected();
    if (totalSelected === 0) {
      toast.error(t('organization.relations.assign.noResourcesSelected', 'Selecciona al menos un recurso'));
      return;
    }

    setIsSubmitting(true);

    try {
      await organizacionesApi.asignarRecursosARelacion(relacionId, {
        vehiculoIds: selectedByType[TipoRecurso.Vehiculo].size > 0
          ? Array.from(selectedByType[TipoRecurso.Vehiculo])
          : undefined,
        conductorIds: selectedByType[TipoRecurso.Conductor].size > 0
          ? Array.from(selectedByType[TipoRecurso.Conductor])
          : undefined,
        dispositivoIds: selectedByType[TipoRecurso.DispositivoTraccar].size > 0
          ? Array.from(selectedByType[TipoRecurso.DispositivoTraccar])
          : undefined,
      });

      toast.success(t('organization.relations.assign.success', 'Recursos compartidos correctamente'));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getTabLabel = (tipo: TipoRecurso) => {
    switch (tipo) {
      case TipoRecurso.Vehiculo:
        return t('common.vehicles', 'Vehiculos');
      case TipoRecurso.Conductor:
        return t('common.drivers', 'Conductores');
      case TipoRecurso.DispositivoTraccar:
        return t('common.devices', 'Dispositivos');
      default:
        return '';
    }
  };

  const getEstadoBadge = (estado: EstadoComparticion) => {
    switch (estado) {
      case EstadoComparticion.Disponible:
        return (
          <Badge variant="success" size="sm">
            {t('organization.relations.assign.available', 'Disponible')}
          </Badge>
        );
      case EstadoComparticion.YaCompartido:
        return (
          <Badge variant="info" size="sm">
            <span className="flex items-center gap-1">
              <Share2 size={10} />
              {t('organization.relations.assign.shared', 'Compartido')}
            </span>
          </Badge>
        );
      case EstadoComparticion.Excluido:
        return (
          <Badge variant="error" size="sm">
            <span className="flex items-center gap-1">
              <Shield size={10} />
              {t('organization.relations.assign.excluded', 'Excluido')}
            </span>
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderResourceItem = (recurso: RecursoCompartibleDto) => {
    const isSelected = selectedByType[activeTab].has(recurso.id);
    const isDisabled = recurso.estado !== EstadoComparticion.Disponible;

    return (
      <div
        key={recurso.id}
        onClick={() => !isDisabled && handleToggleResource(recurso)}
        className={`
          flex items-center justify-between p-3 rounded-lg border transition-all
          ${isDisabled
            ? 'bg-ground/50 border-border/50 cursor-not-allowed opacity-70'
            : isSelected
              ? 'bg-primary/10 border-primary cursor-pointer'
              : 'bg-background border-border hover:border-primary/50 cursor-pointer'
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Checkbox visual */}
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
              ${isDisabled
                ? 'border-border/50 bg-ground/30'
                : isSelected
                  ? 'border-primary bg-primary'
                  : 'border-border'
              }
            `}
          >
            {isSelected && <Check size={12} className="text-white" />}
          </div>

          {/* Nombre y descripcion */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${isDisabled ? 'text-text-muted' : 'text-text'}`}>
              {recurso.nombre}
            </p>
            {recurso.descripcion && (
              <p className="text-xs text-text-muted truncate">{recurso.descripcion}</p>
            )}
          </div>
        </div>

        {/* Badge de estado */}
        <div className="flex-shrink-0 ml-2">
          {getEstadoBadge(recurso.estado)}
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 max-w-3xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-text">
              {t('organization.relations.assign.title', 'Compartir Recursos')}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {t('organization.relations.assign.subtitle', 'Selecciona los recursos que deseas compartir')}
            </p>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="flex rounded-lg bg-ground p-1 mb-4">
            {[TipoRecurso.Vehiculo, TipoRecurso.Conductor, TipoRecurso.DispositivoTraccar].map((tipo) => {
              const isActive = tipo === activeTab;
              const selectedCount = selectedByType[tipo].size;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setActiveTab(tipo)}
                  className={`
                    flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                    ${isActive
                      ? 'bg-background text-text shadow-sm'
                      : 'text-text-muted hover:text-text'
                    }
                  `}
                >
                  {getTabLabel(tipo)}
                  {selectedCount > 0 && (
                    <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder={t('common.search', 'Buscar...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Contadores */}
          {data && !isLoading && (
            <div className="flex gap-4 mb-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                {data.totalDisponibles} {t('organization.relations.assign.available', 'disponibles')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                {data.totalYaCompartidos} {t('organization.relations.assign.shared', 'compartidos')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error" />
                {data.totalExcluidos} {t('organization.relations.assign.excluded', 'excluidos')}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {/* Lista de recursos */}
          <div className="border border-border rounded-lg overflow-hidden mb-4">
            <div className="max-h-[350px] overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-8 text-text-muted">
                  {t('common.loading', 'Cargando...')}
                </div>
              ) : data?.items.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  {debouncedSearch
                    ? t('common.noResults', 'No se encontraron resultados')
                    : t('organization.relations.assign.noResources', 'No hay recursos disponibles')
                  }
                </div>
              ) : (
                data?.items.map(renderResourceItem)
              )}
            </div>

            {/* Paginacion */}
            {data && data.totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-ground/50">
                <span className="text-xs text-text-muted">
                  {t('common.page', 'Pagina')} {data.paginaActual} {t('common.of', 'de')} {data.totalPaginas}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= data.totalPaginas || isLoading}
                    onClick={() => setCurrentPage((p) => Math.min(data.totalPaginas, p + 1))}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="text-sm text-text-muted">
              {getTotalSelected() > 0 && (
                <span>{getTotalSelected()} {t('organization.relations.assign.resourcesSelected', 'recursos seleccionados')}</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || getTotalSelected() === 0}
              >
                {isSubmitting
                  ? t('common.loading', 'Cargando...')
                  : t('organization.relations.assign.share', 'Compartir')
                } ({getTotalSelected()})
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
