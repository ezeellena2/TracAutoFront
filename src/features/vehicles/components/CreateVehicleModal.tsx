import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, ApiErrorBanner } from '@/shared/ui';
import { vehiculosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { DispositivoDto } from '@/shared/types/api';
import type { CreateVehiculoRequest } from '../types';

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  devices: DispositivoDto[];
}

export function CreateVehicleModal({ isOpen, onClose, onSuccess, devices }: CreateVehicleModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  const [createForm, setCreateForm] = useState<CreateVehiculoRequest>({
    tipo: 1,
    patente: '',
    marca: '',
    modelo: '',
    anio: undefined,
  });
  const [createDeviceId, setCreateDeviceId] = useState('');
  const [createErrors, setCreateErrors] = useState<{ patente?: string }>({});
  const [apiError, setApiError] = useState<import('@/hooks').ParsedError | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCreateForm({ tipo: 1, patente: '', marca: '', modelo: '', anio: undefined });
      setCreateDeviceId('');
      setCreateErrors({});
      setApiError(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!createForm.patente.trim()) {
      setCreateErrors({ patente: t('vehicles.form.required') });
      return;
    }

    setIsCreating(true);
    setCreateErrors({});
    setApiError(null);

    try {
      const requestData: CreateVehiculoRequest = {
        ...createForm,
        patente: createForm.patente.trim().toUpperCase(),
        marca: createForm.marca?.trim() || undefined,
        modelo: createForm.modelo?.trim() || undefined,
      };

      const newVehicle = await vehiculosApi.createVehiculo(requestData);

      if (createDeviceId) {
        try {
          await vehiculosApi.assignDispositivo(newVehicle.id, { dispositivoId: createDeviceId });
          toast.success(t('vehicles.success.createdAndAssigned'));
        } catch (assignError) {
          const assignParsed = handleApiError(assignError, { showToast: false });
          toast.warning(t('vehicles.success.assignWarning', { message: assignParsed.message }));
        }
      } else {
        toast.success(t('vehicles.success.created'));
      }

      onSuccess();
      onClose();
    } catch (e) {
      setApiError(handleApiError(e, { showToast: false }));
    } finally {
      setIsCreating(false);
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
        <div className="flex-1 overflow-y-auto p-1">
          {apiError && (
            <div className="mb-4">
              <ApiErrorBanner
                error={apiError}
                jiraLabel={t('vehicles.errors.createFailed', 'Error al crear vehiculo')}
                onReportClick={onClose}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <div className="space-y-6 md:pl-6 md:border-l md:border-border/50">
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
                    {devices.filter((device) => device.activo).map((device) => (
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
