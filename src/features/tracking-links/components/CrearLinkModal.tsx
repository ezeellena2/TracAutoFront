import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { vehiculosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { Modal, Button } from '@/shared/ui';
import { TipoAccesoTracking } from '../types';
import type { CrearLinkTrackingRequest } from '../types';
import type { VehiculoDto } from '@/features/vehicles/types';

interface CrearLinkModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (request: CrearLinkTrackingRequest) => void;
  /** Cuando se pasa, pre-selecciona el vehículo y deshabilita el selector */
  vehiculoIdPreseleccionado?: string;
}

export function CrearLinkModal({ isOpen, isLoading, onClose, onSubmit, vehiculoIdPreseleccionado }: CrearLinkModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  const [vehiculos, setVehiculos] = useState<VehiculoDto[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const [vehiculoId, setVehiculoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('');
  const [tipoAcceso, setTipoAcceso] = useState<TipoAccesoTracking>(TipoAccesoTracking.SoloUbicacion);
  const [maxAccesos, setMaxAccesos] = useState('');

  const loadVehiculos = useCallback(async () => {
    setLoadingVehiculos(true);
    try {
      const result = await vehiculosApi.getVehiculos({ tamanoPagina: 200, soloActivos: true });
      setVehiculos(result.items);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoadingVehiculos(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (isOpen) {
      if (vehiculoIdPreseleccionado) {
        setVehiculoId(vehiculoIdPreseleccionado);
      } else {
        void loadVehiculos();
        setVehiculoId('');
      }
      setNombre('');
      setDuracionMinutos('');
      setTipoAcceso(TipoAccesoTracking.SoloUbicacion);
      setMaxAccesos('');
    }
  }, [isOpen, loadVehiculos, vehiculoIdPreseleccionado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoId) return;

    const request: CrearLinkTrackingRequest = {
      vehiculoId,
      tipoAcceso,
    };
    if (nombre.trim()) request.nombre = nombre.trim();
    if (duracionMinutos) request.duracionMinutos = parseInt(duracionMinutos, 10);
    if (maxAccesos) request.maxAccesos = parseInt(maxAccesos, 10);

    onSubmit(request);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trackingLinks.crearTitulo')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vehículo */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.vehiculo')}</label>
          {vehiculoIdPreseleccionado ? (
            <input
              type="text"
              value={t('trackingLinks.vehiculoPreseleccionado')}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-text-muted cursor-not-allowed"
            />
          ) : (
            <select
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={loadingVehiculos}
            >
              <option value="">{t('trackingLinks.vehiculoPlaceholder')}</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.patente} — {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.nombre')}</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t('trackingLinks.nombrePlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={100}
          />
        </div>

        {/* Tipo de acceso */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.tipoAcceso')}</label>
          <select
            value={tipoAcceso}
            onChange={(e) => setTipoAcceso(Number(e.target.value) as TipoAccesoTracking)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={TipoAccesoTracking.SoloUbicacion}>{t('trackingLinks.tipoAccesoSoloUbicacion')}</option>
            <option value={TipoAccesoTracking.UbicacionConRuta}>{t('trackingLinks.tipoAccesoUbicacionConRuta')}</option>
            <option value={TipoAccesoTracking.Completo}>{t('trackingLinks.tipoAccesoCompleto')}</option>
          </select>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.duracion')}</label>
          <input
            type="number"
            value={duracionMinutos}
            onChange={(e) => setDuracionMinutos(e.target.value)}
            placeholder={t('trackingLinks.duracionPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            min={15}
            max={43200}
          />
          <p className="text-xs text-text-muted mt-1">{t('trackingLinks.duracionDefault')}</p>
        </div>

        {/* Max accesos */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.maxAccesos')}</label>
          <input
            type="number"
            value={maxAccesos}
            onChange={(e) => setMaxAccesos(e.target.value)}
            placeholder={t('trackingLinks.maxAccesosPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            min={1}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !vehiculoId}
          >
            {isLoading ? t('common.loading') : t('trackingLinks.crear')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
