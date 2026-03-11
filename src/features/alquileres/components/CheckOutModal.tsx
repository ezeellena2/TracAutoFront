import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import { useCheckOut } from '../hooks/useCheckOut';
import { FotoInspeccion } from './FotoInspeccion';
import { ESTADO_INSPECCION_KEYS } from '../types/reserva';

interface CheckOutModalProps {
  isOpen: boolean;
  reservaId: string;
  sucursalIdPorDefecto: string;
  sucursales: { value: string; label: string }[];
  onClose: () => void;
}

export function CheckOutModal({
  isOpen,
  reservaId,
  sucursalIdPorDefecto,
  sucursales,
  onClose,
}: CheckOutModalProps) {
  const { t } = useTranslation();

  const {
    kilometrajeInicial,
    setKilometrajeInicial,
    nivelCombustible,
    setNivelCombustible,
    estadoExterior,
    setEstadoExterior,
    estadoExteriorDetalle,
    setEstadoExteriorDetalle,
    estadoInterior,
    setEstadoInterior,
    estadoInteriorDetalle,
    setEstadoInteriorDetalle,
    observaciones,
    setObservaciones,
    sucursalId,
    setSucursalId,
    fotos,
    setFotos,
    isValid,
    isSubmitting,
    apiError,
    handleSubmit,
    resetForm,
  } = useCheckOut(reservaId, sucursalIdPorDefecto, onClose);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const estadoOptions = ESTADO_INSPECCION_KEYS.map(key => ({
    value: key,
    label: t(`alquileres.reservaDetalle.form.estadoOptions.${key}`),
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text">
            {t('alquileres.reservaDetalle.checkOut.titulo')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <ApiErrorBanner error={apiError} jiraLabel="Error check-out reserva" onReportClick={handleClose} />

        <div className="space-y-4">
          {/* Kilometraje */}
          <Input
            label={t('alquileres.reservaDetalle.form.kilometraje')}
            type="number"
            min={0}
            value={kilometrajeInicial}
            onChange={(e) => setKilometrajeInicial(e.target.value)}
            required
          />

          {/* Nivel de combustible — slider */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('alquileres.reservaDetalle.form.nivelCombustible')}
              <span className="ml-2 text-primary font-semibold">
                {t('alquileres.reservaDetalle.form.combustibleLabel', { valor: nivelCombustible })}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={nivelCombustible}
              onChange={(e) => setNivelCombustible(Number(e.target.value))}
              aria-label={t('alquileres.reservaDetalle.form.nivelCombustible')}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Estado exterior */}
          <div className="space-y-2">
            <Select
              label={t('alquileres.reservaDetalle.form.estadoExterior')}
              value={estadoExterior}
              onChange={(v) => setEstadoExterior(String(v))}
              options={estadoOptions}
              placeholder={t('alquileres.reservaDetalle.form.estadoExteriorPlaceholder')}
              required
            />
            {estadoExterior && (
              <Input
                label={t('alquileres.reservaDetalle.form.estadoDetalles')}
                value={estadoExteriorDetalle}
                onChange={(e) => setEstadoExteriorDetalle(e.target.value)}
                placeholder={t('alquileres.reservaDetalle.form.estadoDetallesPlaceholder')}
              />
            )}
          </div>

          {/* Estado interior */}
          <div className="space-y-2">
            <Select
              label={t('alquileres.reservaDetalle.form.estadoInterior')}
              value={estadoInterior}
              onChange={(v) => setEstadoInterior(String(v))}
              options={estadoOptions}
              placeholder={t('alquileres.reservaDetalle.form.estadoInteriorPlaceholder')}
              required
            />
            {estadoInterior && (
              <Input
                label={t('alquileres.reservaDetalle.form.estadoDetalles')}
                value={estadoInteriorDetalle}
                onChange={(e) => setEstadoInteriorDetalle(e.target.value)}
                placeholder={t('alquileres.reservaDetalle.form.estadoDetallesPlaceholder')}
              />
            )}
          </div>

          {/* Observaciones */}
          <Input
            label={t('alquileres.reservaDetalle.form.observaciones')}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder={t('alquileres.reservaDetalle.form.observacionesPlaceholder')}
          />

          {/* Sucursal */}
          <Select
            label={t('alquileres.reservaDetalle.form.sucursal')}
            value={sucursalId}
            onChange={(v) => setSucursalId(String(v))}
            options={sucursales}
            placeholder={t('alquileres.reservaDetalle.form.sucursalPlaceholder')}
            required
          />

          {/* Fotos */}
          <FotoInspeccion
            fotos={fotos}
            onChange={setFotos}
            disabled={isSubmitting}
          />

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
              className="flex-1"
            >
              {isSubmitting ? t('common.saving') : t('alquileres.reservaDetalle.form.confirmar')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
