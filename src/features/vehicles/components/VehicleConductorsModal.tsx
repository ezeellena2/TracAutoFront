import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Badge } from '@/shared/ui';
import { vehiculosApi } from '@/services/endpoints';
import { useErrorHandler, useLocalization } from '@/hooks';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import type { VehiculoDto } from '../types';
import type { ConductorVehiculoAsignacionDto } from '@/features/drivers/types';

interface VehicleConductorsModalProps {
  isOpen: boolean;
  vehicle: VehiculoDto | null;
  onClose: () => void;
  /** Datos iniciales (ej. solo activos desde caché) para mostrar de entrada; luego se refresca con todos (activos + finalizados) sin escribir en caché */
  initialData?: ConductorVehiculoAsignacionDto[];
}

export function VehicleConductorsModal({ isOpen, vehicle, onClose, initialData }: VehicleConductorsModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const { culture, timeZoneId } = useLocalization();
  const [conductores, setConductores] = useState<ConductorVehiculoAsignacionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatDateTimeFn = (dateStr: string) => formatDateTime(dateStr, culture, timeZoneId);

  useEffect(() => {
    if (!isOpen || !vehicle?.id) {
      setConductores([]);
      return;
    }
    // Mostrar initialData de entrada si existe (solo activos desde caché) para evitar parpadeo
    const cached = initialData ?? [];
    setConductores(cached);
    setIsLoading(cached.length === 0);
    // Siempre traer todos (activos + finalizados) para el modal; no escribimos en caché para no alterar el número de la columna
    vehiculosApi
      .getConductoresAsignados(vehicle.id)
      .then((list) => setConductores(list))
      .catch((e) => handleApiError(e))
      .finally(() => setIsLoading(false));
  }, [isOpen, vehicle?.id, handleApiError, initialData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? t('vehicles.conductorsModal.title', { patente: vehicle.patente }) : ''}
      size="2xl"
    >
      <div className="p-6 w-full min-w-0 overflow-visible">
        {isLoading && conductores.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : conductores.length === 0 ? (
          <p className="text-text-muted text-sm">{t('vehicles.conductorsModal.empty')}</p>
        ) : (
          <div className="w-full overflow-visible">
            <table className="w-full min-w-0 table-fixed text-sm">
              <colgroup>
                <col className="w-[min(30%,12rem)]" />
                <col className="w-[min(25%,10rem)]" />
                <col className="w-[min(25%,10rem)]" />
                <col className="w-[min(20%,8rem)]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-text-muted truncate">{t('drivers.fullName')}</th>
                  <th className="px-4 py-2 text-left font-medium text-text-muted truncate">{t('drivers.assignmentsModal.start')}</th>
                  <th className="px-4 py-2 text-left font-medium text-text-muted truncate">{t('drivers.assignmentsModal.end')}</th>
                  <th className="px-4 py-2 text-left font-medium text-text-muted truncate">{t('drivers.assignmentsModal.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conductores.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-text font-medium truncate" title={a.conductorNombre}>{a.conductorNombre}</td>
                    <td className="px-4 py-2 text-text-muted truncate" title={formatDateTimeFn(a.inicioUtc)}>{formatDateTimeFn(a.inicioUtc)}</td>
                    <td className="px-4 py-2 text-text-muted truncate" title={a.finUtc ? formatDateTimeFn(a.finUtc) : '-'}>
                      {a.finUtc ? formatDateTimeFn(a.finUtc) : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={a.finUtc ? 'default' : 'success'}>
                        {a.finUtc ? t('drivers.assignmentsModal.finished') : t('drivers.assignmentsModal.active')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
