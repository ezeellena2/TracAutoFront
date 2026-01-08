import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Search, X, AlertOctagon, Check } from 'lucide-react';
import {
    Modal,
    Button,
    Input,
    Badge
} from '@/shared/ui';
import {
    organizacionesApi,
    vehiculosApi,
    conductoresApi,
    dispositivosApi
} from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import {
    ResourceExclusionDto,
    TipoRecurso,
    AddResourceExclusionsCommand,
    RemoveResourceExclusionsCommand,
    VehiculoDto,
    DispositivoDto
} from '@/shared/types/api';
import { ConductorDto } from '@/features/drivers/types';
import { useLocalizationStore } from '@/store/localization.store';
import { formatDate } from '@/shared/utils/dateFormatter';

interface GestionarExclusionesModalProps {
    isOpen: boolean;
    onClose: () => void;
    relacionId: string;
    organizacionContrariaNombre: string;
    esOutbound: boolean; // true = Exclusiones que YO aplico (editable), false = Exclusiones que ME aplican (readonly)
}

export function GestionarExclusionesModal({
    isOpen,
    onClose,
    relacionId,
    organizacionContrariaNombre,
    esOutbound
}: GestionarExclusionesModalProps) {
    const { t } = useTranslation();
    const { getErrorMessage } = useErrorHandler();
    const { preferences } = useLocalizationStore();
    const culture = preferences?.culture ?? 'es-AR';
    const timeZoneId = preferences?.timeZoneId ?? 'America/Argentina/Buenos_Aires';

    // Estado para exclusiones activas
    const [exclusiones, setExclusiones] = useState<ResourceExclusionDto[]>([]);
    const [isLoadingExclusiones, setIsLoadingExclusiones] = useState(false);

    // Estado para agregar nuevas exclusiones
    const [activeTab, setActiveTab] = useState<string>(String(TipoRecurso.Vehiculo));
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<(VehiculoDto | ConductorDto | DispositivoDto)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
    const [motivoExclusion, setMotivoExclusion] = useState('');

    // Estado de acciones
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar exclusiones al abrir
    useEffect(() => {
        if (isOpen && relacionId) {
            loadExclusiones();
            // Limpiar estados de búsqueda
            setSearchTerm('');
            setSearchResults([]);
            setSelectedResources(new Set());
            setMotivoExclusion('');
            setError(null);
        }
    }, [isOpen, relacionId]);

    // Buscar recursos cuando cambia el término o el tab
    useEffect(() => {
        if (esOutbound && searchTerm.length >= 2) {
            const delaySearch = setTimeout(() => {
                searchResources();
            }, 500);
            return () => clearTimeout(delaySearch);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, activeTab, esOutbound]);

    const loadExclusiones = async () => {
        try {
            setIsLoadingExclusiones(true);
            setError(null);
            const data = await organizacionesApi.getExclusiones(
                relacionId,
                esOutbound ? 'outbound' : 'inbound'
            );
            setExclusiones(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoadingExclusiones(false);
        }
    };

    const searchResources = async () => {
        try {
            setIsSearching(true);
            const tipo = parseInt(activeTab) as TipoRecurso;
            let results: (VehiculoDto | ConductorDto | DispositivoDto)[] = [];

            // Nota: Buscamos recursos PROPIOS para poder excluirlos (soloPropios: true)
            switch (tipo) {
                case TipoRecurso.Vehiculo:
                    const vData = await vehiculosApi.getVehiculos({
                        filtroPatente: searchTerm,
                        tamanoPagina: 20,
                        soloPropios: true // Solo mostrar vehículos propios, no compartidos
                    });
                    results = vData.items;
                    break;
                case TipoRecurso.Conductor:
                    const cData = await conductoresApi.listar({
                        buscar: searchTerm,
                        tamanoPagina: 20,
                        soloPropios: true // Solo mostrar conductores propios, no compartidos
                    });
                    results = cData.items;
                    break;
                case TipoRecurso.DispositivoTraccar:
                    // Filtrar localmente por nombre ya que el backend no soporta filtro por nombre aún
                    const dData = await dispositivosApi.getDispositivos({
                        tamanoPagina: 50,
                        soloPropios: true // Solo mostrar dispositivos propios, no compartidos
                    });
                    results = dData.items.filter(d =>
                        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.uniqueId && d.uniqueId.includes(searchTerm))
                    );
                    break;
            }

            // Filtrar los que ya están excluidos
            const excludedIds = new Set(exclusiones
                .filter(e => e.resourceType === tipo && e.activo)
                .map(e => e.resourceId));

            setSearchResults(results.filter(r => !excludedIds.has(r.id)));
        } catch (err) {
            console.error('Error searching resources:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddExclusions = async () => {
        if (selectedResources.size === 0) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const command: AddResourceExclusionsCommand = {
                resourceType: parseInt(activeTab),
                resourceIds: Array.from(selectedResources),
                motivo: motivoExclusion || undefined
            };

            await organizacionesApi.addExclusiones(relacionId, command);

            // Reset y recargar
            setSelectedResources(new Set());
            setMotivoExclusion('');
            setSearchTerm('');
            await loadExclusiones();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveExclusion = async (exclusion: ResourceExclusionDto) => {
        try {
            setIsSubmitting(true);
            const command: RemoveResourceExclusionsCommand = {
                resourceType: exclusion.resourceType,
                resourceIds: [exclusion.resourceId]
            };
            await organizacionesApi.removeExclusiones(relacionId, command);
            await loadExclusiones();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleResourceSelection = (id: string) => {
        const newSet = new Set(selectedResources);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedResources(newSet);
    };

    const getResourceName = (res: any, type: TipoRecurso) => {
        switch (type) {
            case TipoRecurso.Vehiculo: return `${res.patente} ${res.marca || ''} ${res.modelo || ''}`.trim();
            case TipoRecurso.Conductor: return res.nombreCompleto || 'Sin nombre';
            case TipoRecurso.DispositivoTraccar: return res.nombre || res.uniqueId || 'Sin nombre';
            default: return 'Desconocido';
        }
    };

    const getSearchPlaceholder = () => {
        switch (activeTab) {
            case String(TipoRecurso.Vehiculo): return t('common.searchPlaceholder.vehicle', 'Buscar por patente, marca, modelo...');
            case String(TipoRecurso.Conductor): return t('common.searchPlaceholder.driver', 'Buscar por nombre, DNI...');
            case String(TipoRecurso.DispositivoTraccar): return t('common.searchPlaceholder.device', 'Buscar por alias, ID...');
            default: return t('common.search', 'Buscar...');
        }
    };

    const renderExclusionItem = (exclusion: ResourceExclusionDto) => (
        <div key={exclusion.id} className="flex items-center justify-between p-3 bg-ground border border-border rounded-md mb-2">
            <div className="flex flex-col">
                <span className="font-medium text-text">{exclusion.resourceName || 'Recurso sin nombre'}</span>
                {exclusion.motivo && (
                    <span className="text-xs text-text-muted italic">{exclusion.motivo}</span>
                )}
                <span className="text-xs text-text-muted">
                    Excluido el {formatDate(exclusion.fechaCreacion, culture, timeZoneId)}
                </span>
            </div>
            {esOutbound && (
                <Button
                    variant="ghost"
                    style={{ color: 'red' }} // Tailwind error color fallback
                    onClick={() => handleRemoveExclusion(exclusion)}
                    disabled={isSubmitting}
                >
                    <X size={16} />
                </Button>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Shield className="text-primary" />
                    {esOutbound
                        ? t('organization.exclusions.titleOutbound', 'Gestionar Exclusiones (Compartido por mí)')
                        : t('organization.exclusions.titleInbound', 'Exclusiones Activas (Compartido por ellos)')}
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">

                {/* Header Info */}
                <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3">
                    <AlertOctagon className="text-primary mt-0.5 shrink-0" size={20} />
                    <div className="text-sm">
                        <p className="font-semibold text-text">
                            {esOutbound
                                ? `Estás gestionando qué recursos NO puede ver ${organizacionContrariaNombre}.`
                                : `Estos son los recursos que ${organizacionContrariaNombre} ha decidido NO compartir contigo.`}
                        </p>
                        <p className="text-text-muted mt-1">
                            Las exclusiones tienen prioridad sobre la asignación automática. (Deny {'>'} Allow).
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Custom Tabs */}
                <div className="space-y-4">
                    <div className="flex rounded-md bg-secondary/10 p-1">
                        {[TipoRecurso.Vehiculo, TipoRecurso.Conductor, TipoRecurso.DispositivoTraccar].map((type) => {
                            const label = type === TipoRecurso.Vehiculo ? t('common.vehicles', 'Vehículos') :
                                type === TipoRecurso.Conductor ? t('common.drivers', 'Conductores') :
                                    t('common.devices', 'Dispositivos');
                            const isActive = String(type) === activeTab;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(String(type))}
                                    className={`
                    flex-1 px-3 py-1.5 text-sm font-medium rounded-sm transition-all
                    ${isActive
                                            ? 'bg-background text-text shadow-sm'
                                            : 'text-text-muted hover:text-text'}
                  `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4">
                        {/* Solo mostrar buscador si es Outbound (editable) */}
                        {esOutbound && (
                            <div className="space-y-4 mb-6 border-b border-border pb-6">
                                <h4 className="font-medium text-text text-sm mb-2">
                                    {t('organization.exclusions.addTitle', 'Agregar nueva exclusión')}
                                </h4>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-2.5 text-text-muted">
                                            <Search size={16} />
                                        </div>
                                        <Input
                                            placeholder={getSearchPlaceholder()}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-full"
                                        />
                                    </div>
                                </div>

                                {/* Resultados de búsqueda */}
                                {isSearching ? (
                                    <div className="flex justify-center p-4 text-sm text-text-muted">
                                        {t('common.loading', 'Cargando...')}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="bg-ground border border-border rounded-md max-h-48 overflow-y-auto">
                                        {searchResults.map((res) => {
                                            const isSelected = selectedResources.has(res.id);
                                            return (
                                                <div
                                                    key={res.id}
                                                    className={`
                            flex items-center justify-between p-2 px-3 cursor-pointer hover:bg-background-hover transition-colors
                            ${isSelected ? 'bg-primary/5' : ''}
                          `}
                                                    onClick={() => toggleResourceSelection(res.id)}
                                                >
                                                    <span className="text-sm">{getResourceName(res, parseInt(activeTab))}</span>
                                                    {isSelected && <Check size={16} className="text-primary" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : searchTerm.length >= 2 ? (
                                    <div className="text-center text-sm text-text-muted py-2">
                                        {t('common.noResults', 'Sin resultados')}
                                    </div>
                                ) : null}

                                {/* Formulario de confirmación */}
                                {selectedResources.size > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 space-y-3 bg-ground p-3 rounded-md border border-border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">
                                                {selectedResources.size} recursos seleccionados
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedResources(new Set())}>
                                                {t('common.clear', 'Limpiar')}
                                            </Button>
                                        </div>

                                        <textarea
                                            placeholder="Motivo de la exclusión (opcional)..."
                                            value={motivoExclusion}
                                            onChange={(e) => setMotivoExclusion(e.target.value)}
                                            rows={2}
                                            className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />

                                        <Button
                                            className="w-full"
                                            onClick={handleAddExclusions}
                                            disabled={isSubmitting}
                                        >
                                            <Shield size={16} className="mr-2" />
                                            {t('organization.exclusions.confirmAdd', 'Confirmar Exclusiones')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Lista de Exclusiones Activas */}
                        <div>
                            <h4 className="font-medium text-text text-sm mb-3 flex items-center justify-between">
                                <span>{t('organization.exclusions.activeList', 'Exclusiones Activas')}</span>
                                <Badge variant="default">
                                    {exclusiones.filter(e => e.resourceType === parseInt(activeTab)).length}
                                </Badge>
                            </h4>

                            {isLoadingExclusiones ? (
                                <div className="flex justify-center p-8 text-sm text-text-muted">
                                    {t('common.loading', 'Cargando...')}
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto">
                                    {exclusiones
                                        .filter(e => e.resourceType === parseInt(activeTab))
                                        .map(renderExclusionItem)}

                                    {exclusiones.filter(e => e.resourceType === parseInt(activeTab)).length === 0 && (
                                        <div className="text-center py-8 text-text-muted border border-dashed border-border rounded-lg">
                                            {t('organization.relations.empty', 'No hay registros')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        {t('common.close', 'Cerrar')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
