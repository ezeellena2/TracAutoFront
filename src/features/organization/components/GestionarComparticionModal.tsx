import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Check, X, Shield, Loader2, Building2 } from 'lucide-react';
import { Modal, Button, Badge } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';
import {
    TipoRecurso,
    RecursoSharingStatusDto,
    RelacionSharingItemDto,
    EstadoComparticionDeseado,
    CambioComparticionRelacion,
} from '@/shared/types/api';
import { vehiculosApi, conductoresApi, dispositivosApi } from '@/services/endpoints';

interface GestionarComparticionModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceId: string;
    resourceType: TipoRecurso;
    resourceName: string;
    onSuccess?: () => void;
}

type EstadoLocal = 'disponible' | 'compartido' | 'excluido';

interface RelacionConEstadoLocal extends RelacionSharingItemDto {
    estadoLocal: EstadoLocal;
    estadoOriginal: EstadoLocal;
    modificado: boolean;
}

/**
 * Modal para gestionar la compartición de un recurso individual.
 * Muestra todas las relaciones activas y permite compartir, descompartir o excluir el recurso en cada una.
 */
export function GestionarComparticionModal({
    isOpen,
    onClose,
    resourceId,
    resourceType,
    resourceName,
    onSuccess,
}: GestionarComparticionModalProps) {
    const { t } = useTranslation();
    const { getErrorMessage } = useErrorHandler();

    const [sharingStatus, setSharingStatus] = useState<RecursoSharingStatusDto | null>(null);
    const [relaciones, setRelaciones] = useState<RelacionConEstadoLocal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Función para convertir estado del backend a estado local
    const getEstadoFromDto = (item: RelacionSharingItemDto): EstadoLocal => {
        if (item.estaExcluido) return 'excluido';
        if (item.estaCompartido) return 'compartido';
        return 'disponible';
    };

    // Cargar estado de compartición al abrir
    const loadSharingStatus = useCallback(async () => {
        if (!isOpen || !resourceId) return;

        try {
            setIsLoading(true);
            setError(null);

            let data: RecursoSharingStatusDto;
            switch (resourceType) {
                case TipoRecurso.Vehiculo:
                    data = await vehiculosApi.getSharingStatus(resourceId);
                    break;
                case TipoRecurso.Conductor:
                    data = await conductoresApi.getSharingStatus(resourceId);
                    break;
                case TipoRecurso.DispositivoTraccar:
                    data = await dispositivosApi.getSharingStatus(resourceId);
                    break;
                default:
                    throw new Error('Tipo de recurso no soportado');
            }

            setSharingStatus(data);

            // Convertir a estado local con tracking de cambios
            const relacionesConEstado: RelacionConEstadoLocal[] = data.relaciones.map((rel) => {
                const estadoOriginal = getEstadoFromDto(rel);
                return {
                    ...rel,
                    estadoLocal: estadoOriginal,
                    estadoOriginal,
                    modificado: false,
                };
            });
            setRelaciones(relacionesConEstado);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, resourceId, resourceType, getErrorMessage]);

    useEffect(() => {
        loadSharingStatus();
    }, [loadSharingStatus]);

    // Ciclar estado: disponible -> compartido -> excluido -> disponible
    const cycleEstado = (current: EstadoLocal): EstadoLocal => {
        switch (current) {
            case 'disponible':
                return 'compartido';
            case 'compartido':
                return 'excluido';
            case 'excluido':
                return 'disponible';
        }
    };

    // Cambiar estado de una relación
    const handleToggleEstado = (relacionId: string) => {
        setRelaciones((prev) =>
            prev.map((rel) => {
                if (rel.relacionId !== relacionId) return rel;

                const nuevoEstado = cycleEstado(rel.estadoLocal);
                return {
                    ...rel,
                    estadoLocal: nuevoEstado,
                    modificado: nuevoEstado !== rel.estadoOriginal,
                };
            })
        );
    };

    // Guardar cambios
    const handleSave = async () => {
        const cambios: CambioComparticionRelacion[] = relaciones
            .filter((rel) => rel.modificado)
            .map((rel) => ({
                relacionId: rel.relacionId,
                nuevoEstado: 
                    rel.estadoLocal === 'compartido' ? EstadoComparticionDeseado.Compartido :
                    rel.estadoLocal === 'excluido' ? EstadoComparticionDeseado.Excluido :
                    EstadoComparticionDeseado.Disponible,
            }));

        if (cambios.length === 0) {
            onClose();
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            switch (resourceType) {
                case TipoRecurso.Vehiculo:
                    await vehiculosApi.updateSharingStatus(resourceId, { cambios });
                    break;
                case TipoRecurso.Conductor:
                    await conductoresApi.updateSharingStatus(resourceId, { cambios });
                    break;
                case TipoRecurso.DispositivoTraccar:
                    await dispositivosApi.updateSharingStatus(resourceId, { cambios });
                    break;
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    // Verificar si hay cambios pendientes
    const hasPendingChanges = relaciones.some((rel) => rel.modificado);

    // Obtener color y texto del estado
    const getEstadoBadge = (estado: EstadoLocal) => {
        switch (estado) {
            case 'compartido':
                return <Badge variant="success">Compartido</Badge>;
            case 'excluido':
                return <Badge variant="error">Excluido</Badge>;
            default:
                return <Badge variant="default">Disponible</Badge>;
        }
    };

    // Obtener icono del estado
    const getEstadoIcon = (estado: EstadoLocal) => {
        switch (estado) {
            case 'compartido':
                return <Check size={16} className="text-success" />;
            case 'excluido':
                return <Shield size={16} className="text-error" />;
            default:
                return <div className="w-4 h-4" />;
        }
    };

    // Obtener título según tipo de recurso
    const getResourceTypeLabel = () => {
        switch (resourceType) {
            case TipoRecurso.Vehiculo:
                return t('common.vehicle', 'Vehículo');
            case TipoRecurso.Conductor:
                return t('common.driver', 'Conductor');
            case TipoRecurso.DispositivoTraccar:
                return t('common.device', 'Dispositivo');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Share2 className="text-primary" />
                    {t('organization.sharing.title', 'Gestionar Compartición')}
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Building2 className="text-primary mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="font-semibold text-text">
                                {getResourceTypeLabel()}: <span className="text-primary">{resourceName}</span>
                            </p>
                            <p className="text-sm text-text-muted mt-1">
                                {t('organization.sharing.description', 'Haz click en cada relación para cambiar el estado de compartición. Los cambios se guardarán al presionar "Guardar".')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leyenda de estados */}
                <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="default">Disponible</Badge>
                        <span className="text-text-muted">- No compartido</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="success">Compartido</Badge>
                        <span className="text-text-muted">- Visible para la otra org</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Badge variant="error">Excluido</Badge>
                        <span className="text-text-muted">- Bloqueado</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Lista de Relaciones */}
                <div>
                    <h4 className="font-medium text-text text-sm mb-3 flex items-center justify-between">
                        <span>{t('organization.sharing.relations', 'Relaciones')}</span>
                        {relaciones.length > 0 && (
                            <span className="text-text-muted font-normal">
                                {relaciones.length} {relaciones.length === 1 ? 'relación' : 'relaciones'}
                            </span>
                        )}
                    </h4>

                    {isLoading ? (
                        <div className="flex justify-center items-center p-8 text-text-muted">
                            <Loader2 className="animate-spin mr-2" size={20} />
                            {t('common.loading', 'Cargando...')}
                        </div>
                    ) : relaciones.length === 0 ? (
                        <div className="text-center py-8 text-text-muted border border-dashed border-border rounded-lg">
                            {t('organization.sharing.noRelations', 'No hay relaciones activas con policies para compartir este tipo de recurso.')}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {relaciones.map((rel) => (
                                <button
                                    key={rel.relacionId}
                                    onClick={() => handleToggleEstado(rel.relacionId)}
                                    className={`
                                        w-full flex items-center justify-between p-3 rounded-lg border transition-all
                                        hover:bg-surface-hover cursor-pointer
                                        ${rel.modificado ? 'border-primary bg-primary/5' : 'border-border bg-ground'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {getEstadoIcon(rel.estadoLocal)}
                                        <div className="text-left">
                                            <div className="font-medium text-text">
                                                {rel.organizacionDestinoNombre}
                                            </div>
                                            {rel.estadoLocal === 'compartido' && rel.fechaCompartido && (
                                                <div className="text-xs text-text-muted">
                                                    Desde {new Date(rel.fechaCompartido).toLocaleDateString()}
                                                </div>
                                            )}
                                            {rel.estadoLocal === 'excluido' && rel.motivoExclusion && (
                                                <div className="text-xs text-text-muted italic">
                                                    "{rel.motivoExclusion}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getEstadoBadge(rel.estadoLocal)}
                                        {rel.modificado && (
                                            <span className="text-xs text-primary font-medium">
                                                (modificado)
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasPendingChanges || isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={16} />
                                {t('common.saving', 'Guardando...')}
                            </>
                        ) : (
                            t('common.save', 'Guardar Cambios')
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
