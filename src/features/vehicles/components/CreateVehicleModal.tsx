import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '@/shared/ui';
import { vehiculosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import { useTenantStore } from '@/store';
import { TipoExtensionVehiculo, CreateVehiculoRequest, VehiculoAseguradoraCreateData, VehiculoAlquilerCreateData, VehiculoTaxiCreateData, VehiculoOtrosCreateData } from '../types';
import { DispositivoDto } from '@/shared/types/api';
import { shouldShowExtensionForm, getExtensionTypeForOrgType } from '../utils/extensionHelpers';
import { AseguradoraExtensionForm } from './AseguradoraExtensionForm';
import { AlquilerExtensionForm } from './AlquilerExtensionForm';
import { TaxiExtensionForm } from './TaxiExtensionForm';
import { OtrosExtensionForm } from './OtrosExtensionForm';

interface CreateVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    devices: DispositivoDto[];
}

export function CreateVehicleModal({ isOpen, onClose, onSuccess, devices }: CreateVehicleModalProps) {
    const { t } = useTranslation();
    const { getErrorMessage } = useErrorHandler();

    // Organization Context
    const { currentOrganization } = useTenantStore();
    const orgType = currentOrganization?.tipoOrganizacion;
    const showExtensionForm = shouldShowExtensionForm(orgType);
    const extensionType = getExtensionTypeForOrgType(orgType);

    // Form State
    const [createForm, setCreateForm] = useState<CreateVehiculoRequest>({
        tipo: 1, // Auto
        patente: '',
        marca: '',
        modelo: '',
        anio: undefined,
    });

    // Extension States
    const [extensionDataAseguradora, setExtensionDataAseguradora] = useState<VehiculoAseguradoraCreateData>({});
    const [extensionDataAlquiler, setExtensionDataAlquiler] = useState<VehiculoAlquilerCreateData>({ categoriaId: '' });
    const [extensionDataTaxi, setExtensionDataTaxi] = useState<VehiculoTaxiCreateData>({});
    const [extensionDataOtros, setExtensionDataOtros] = useState<VehiculoOtrosCreateData>({ tipoContexto: '' });

    const [createDeviceId, setCreateDeviceId] = useState('');
    const [createErrors, setCreateErrors] = useState<{ patente?: string; categoriaId?: string; tipoContexto?: string }>({});
    const [isCreating, setIsCreating] = useState(false);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setCreateForm({ tipo: 1, patente: '', marca: '', modelo: '', anio: undefined });
            setExtensionDataAseguradora({});
            setExtensionDataAlquiler({ categoriaId: '' });
            setExtensionDataTaxi({});
            setExtensionDataOtros({ tipoContexto: '' });
            setCreateDeviceId('');
            setCreateErrors({});
        }
    }, [isOpen]);

    const handleCreate = async () => {
        const errors: { patente?: string; categoriaId?: string; tipoContexto?: string } = {};
        if (!createForm.patente.trim()) {
            errors.patente = t('vehicles.form.required');
        }

        // Validate required fields for extensions
        if (extensionType === TipoExtensionVehiculo.Alquiler && !extensionDataAlquiler.categoriaId) {
            errors.categoriaId = t('vehicles.form.required');
        }
        if (extensionType === TipoExtensionVehiculo.Otros && !extensionDataOtros.tipoContexto) {
            errors.tipoContexto = t('vehicles.form.required');
        }

        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors);
            return;
        }

        setIsCreating(true);
        setCreateErrors({});

        try {
            // Prepare extension data
            const extensionesSolicitadas = showExtensionForm
                ? extensionType
                : TipoExtensionVehiculo.Ninguno;

            const requestData: CreateVehiculoRequest = {
                ...createForm,
                patente: createForm.patente.trim().toUpperCase(),
                marca: createForm.marca?.trim() || undefined,
                extensionesSolicitadas,
            };

            // Add extension-specific data
            if (extensionesSolicitadas === TipoExtensionVehiculo.Aseguradora) {
                requestData.datosAseguradora = {
                    ...extensionDataAseguradora,
                    numeroPoliza: extensionDataAseguradora.numeroPoliza || undefined,
                    companiaAseguradora: extensionDataAseguradora.companiaAseguradora || undefined,
                    tipoCobertura: extensionDataAseguradora.tipoCobertura || undefined,
                    valorAsegurado: extensionDataAseguradora.valorAsegurado || undefined,
                    fechaInicioCobertura: extensionDataAseguradora.fechaInicioCobertura || undefined,
                    fechaVencimientoPoliza: extensionDataAseguradora.fechaVencimientoPoliza || undefined,
                };
            } else if (extensionesSolicitadas === TipoExtensionVehiculo.Alquiler) {
                requestData.datosAlquiler = {
                    ...extensionDataAlquiler,
                    categoriaId: extensionDataAlquiler.categoriaId,
                    sucursalBaseId: extensionDataAlquiler.sucursalBaseId || undefined,
                    estado: extensionDataAlquiler.estado || undefined,
                    disponibleDesdeUtc: extensionDataAlquiler.disponibleDesdeUtc || undefined,
                    disponibleHastaUtc: extensionDataAlquiler.disponibleHastaUtc || undefined,
                    kilometrosMaxDia: extensionDataAlquiler.kilometrosMaxDia || undefined,
                    notas: extensionDataAlquiler.notas || undefined,
                };
            } else if (extensionesSolicitadas === TipoExtensionVehiculo.Taxi) {
                requestData.datosTaxi = {
                    ...extensionDataTaxi,
                    numeroLicencia: extensionDataTaxi.numeroLicencia || undefined,
                    numeroInterno: extensionDataTaxi.numeroInterno || undefined,
                    habilitadoParaServicio: extensionDataTaxi.habilitadoParaServicio ?? true,
                    vencimientoVTV: extensionDataTaxi.vencimientoVTV || undefined,
                    vencimientoSeguro: extensionDataTaxi.vencimientoSeguro || undefined,
                };
            } else if (extensionesSolicitadas === TipoExtensionVehiculo.Otros) {
                requestData.datosOtros = {
                    ...extensionDataOtros,
                    tipoContexto: extensionDataOtros.tipoContexto,
                    descripcion: extensionDataOtros.descripcion || undefined,
                    metadatosJson: extensionDataOtros.metadatosJson || undefined,
                };
            }

            // 1. Create vehicle
            const newVehicle = await vehiculosApi.createVehiculo(requestData);

            // 2. If device selected, assign it
            if (createDeviceId) {
                try {
                    await vehiculosApi.assignDispositivo(newVehicle.id, {
                        dispositivoId: createDeviceId,
                    });
                    toast.success(t('vehicles.success.createdAndAssigned'));
                } catch (assignError) {
                    toast.warning(t('vehicles.success.assignWarning', { message: getErrorMessage(assignError) }));
                }
            } else {
                toast.success(t('vehicles.success.created'));
            }

            onSuccess();
            onClose();
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setIsCreating(false);
        }
    };

    const renderExtensionForm = () => {
        if (!showExtensionForm) return null;

        switch (extensionType) {
            case TipoExtensionVehiculo.Aseguradora:
                return (
                    <AseguradoraExtensionForm
                        value={extensionDataAseguradora}
                        onChange={setExtensionDataAseguradora}
                    />
                );
            case TipoExtensionVehiculo.Alquiler:
                return (
                    <AlquilerExtensionForm
                        value={extensionDataAlquiler}
                        onChange={setExtensionDataAlquiler}
                        errors={{ categoriaId: createErrors.categoriaId }}
                    />
                );
            case TipoExtensionVehiculo.Taxi:
                return (
                    <TaxiExtensionForm
                        value={extensionDataTaxi}
                        onChange={setExtensionDataTaxi}
                    />
                );
            case TipoExtensionVehiculo.Otros:
                return (
                    <OtrosExtensionForm
                        value={extensionDataOtros}
                        onChange={setExtensionDataOtros}
                        errors={{ tipoContexto: createErrors.tipoContexto }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('vehicles.createVehicle')}
            size="4xl"
        >
            <div className="flex flex-col h-full max-h-[85vh]">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Check if we have extensions or GPS to show right column, otherwise center or use full width */}
                        {/* For now, assuming consistent 2-col layout if there might be extensions */}

                        {/* Left Column: Core Data */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text border-b border-border pb-2 mb-4">
                                {t('vehicles.form.vehicleData')}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <Input
                                        label={t('vehicles.form.licensePlate')}
                                        value={createForm.patente}
                                        onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
                                        placeholder={t('vehicles.form.licensePlatePlaceholder')}
                                        error={createErrors.patente}
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label={t('vehicles.form.year')}
                                        type="number"
                                        value={createForm.anio?.toString() || ''}
                                        onChange={(e) => setCreateForm({ ...createForm, anio: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder={t('vehicles.form.yearPlaceholder')}
                                    />
                                </div>
                            </div>

                            <Input
                                label={t('vehicles.form.brand')}
                                value={createForm.marca || ''}
                                onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
                                placeholder={t('vehicles.form.brandPlaceholder')}
                            />
                            <Input
                                label={t('vehicles.form.model')}
                                value={createForm.modelo || ''}
                                onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
                                placeholder={t('vehicles.form.modelPlaceholder')}
                            />
                        </div>

                        {/* Right Column: Extensions & Config */}
                        <div className="space-y-6 md:pl-6 md:border-l md:border-border/50">

                            {/* Extension Form Section */}
                            {showExtensionForm && (
                                <div className="bg-background-subtle/30 rounded-lg p-4 border border-border/50">
                                    <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-3">
                                        {t('vehicles.form.extensionData')}
                                    </h3>
                                    {renderExtensionForm()}
                                </div>
                            )}

                            {/* GPS Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-text uppercase tracking-wider mb-3">
                                    {t('vehicles.form.deviceConfiguration')}
                                </h3>
                                <div className="bg-background-subtle/30 rounded-lg p-4 border border-border/50">
                                    <label className="block text-sm font-medium text-text mb-2">
                                        {t('vehicles.form.deviceOptional')}
                                    </label>
                                    <select
                                        value={createDeviceId}
                                        onChange={(e) => setCreateDeviceId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">{t('vehicles.form.noDevice')}</option>
                                        {devices.filter(d => d.activo).map((device) => (
                                            <option key={device.id} value={device.id}>
                                                {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-text-muted mt-1">
                                        {t('vehicles.form.deviceHint')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-border mt-6 pt-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isCreating}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating}>
                        {isCreating ? t('vehicles.creating') : t('common.create')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
