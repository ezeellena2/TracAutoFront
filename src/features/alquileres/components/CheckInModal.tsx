import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import { useCheckIn } from '../hooks/useCheckIn';
import { FotoInspeccion } from './FotoInspeccion';
import { ESTADO_INSPECCION_KEYS } from '../types/reserva';
import type { CheckOutAlquilerDto, CheckInAlquilerDto } from '../types/reserva';
import { formatPrecio } from '../utils/formatters';

interface CheckInModalProps {
  isOpen: boolean;
  reservaId: string;
  sucursalIdPorDefecto: string;
  sucursales: { value: string; label: string }[];
  checkOutData: CheckOutAlquilerDto | null;
  checkInData: CheckInAlquilerDto | null;
  onClose: () => void;
}

export function CheckInModal({
  isOpen,
  reservaId,
  sucursalIdPorDefecto,
  sucursales,
  checkOutData,
  checkInData,
  onClose,
}: CheckInModalProps) {
  const { t } = useTranslation();

  const {
    kilometrajeFinal,
    setKilometrajeFinal,
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
    danosDetectados,
    setDanosDetectados,
    descripcionDanos,
    setDescripcionDanos,
    recargoDanos,
    setRecargoDanos,
    observaciones,
    setObservaciones,
    sucursalId,
    setSucursalId,
    fotos,
    setFotos,
    isValid,
    kmMin,
    isSubmitting,
    apiError,
    handleSubmit,
    resetForm,
  } = useCheckIn(reservaId, checkOutData, sucursalIdPorDefecto, onClose);

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
            {t('alquileres.reservaDetalle.checkIn.titulo')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <ApiErrorBanner error={apiError} jiraLabel="Error check-in reserva" onReportClick={handleClose} />

        <div className="space-y-4">
          {/* Kilometraje */}
          <Input
            label={t('alquileres.reservaDetalle.form.kilometrajeMin', { min: kmMin })}
            type="number"
            min={kmMin}
            value={kilometrajeFinal}
            onChange={(e) => setKilometrajeFinal(e.target.value)}
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
              aria-label="Nivel de combustible"
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

          {/* Daños */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={danosDetectados}
              onChange={(e) => setDanosDetectados(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-text">
              {t('alquileres.reservaDetalle.form.danosDetectados')}
            </span>
          </label>

          {danosDetectados && (
            <>
              <Input
                label={t('alquileres.reservaDetalle.form.descripcionDanos')}
                value={descripcionDanos}
                onChange={(e) => setDescripcionDanos(e.target.value)}
                placeholder={t('alquileres.reservaDetalle.form.descripcionDanosPlaceholder')}
                required
              />
              <Input
                label={t('alquileres.reservaDetalle.form.recargoDanos')}
                type="number"
                min={0}
                value={recargoDanos}
                onChange={(e) => setRecargoDanos(e.target.value)}
              />
            </>
          )}

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

          {/* Recargos preview (read-only, solo si ya hay checkIn data) */}
          {checkInData && (
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <h4 className="text-sm font-semibold text-text">
                {t('alquileres.reservaDetalle.checkIn.recargosPreview')}
              </h4>
              {checkInData.totalRecargosCheckIn > 0 ? (
                <div className="space-y-1 text-sm">
                  {checkInData.recargoCombustible > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoCombustible')}</span>
                      <span className="text-text">{formatPrecio(checkInData.recargoCombustible)}</span>
                    </div>
                  )}
                  {checkInData.recargoKmExcedente > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoKm')}</span>
                      <span className="text-text">{formatPrecio(checkInData.recargoKmExcedente)}</span>
                    </div>
                  )}
                  {checkInData.recargoTardanza > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoTardanza')}</span>
                      <span className="text-text">{formatPrecio(checkInData.recargoTardanza)}</span>
                    </div>
                  )}
                  {checkInData.recargoDanos != null && checkInData.recargoDanos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoDanos')}</span>
                      <span className="text-text">{formatPrecio(checkInData.recargoDanos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-border font-semibold">
                    <span className="text-text">{t('alquileres.reservaDetalle.checkIn.totalRecargos')}</span>
                    <span className="text-text">{formatPrecio(checkInData.totalRecargosCheckIn)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">{t('alquileres.reservaDetalle.checkIn.sinRecargos')}</p>
              )}
            </div>
          )}

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
