import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Button, ApiErrorBanner } from '@/shared/ui';
import { useCrearReserva } from '../../hooks/useCrearReserva';
import { StepIndicator } from './StepIndicator';
import { PasoCliente } from './PasoCliente';
import { PasoVehiculo } from './PasoVehiculo';
import { PasoOpciones } from './PasoOpciones';
import { PasoResumen } from './PasoResumen';

interface ModalCrearReservaProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalCrearReserva({ isOpen, onClose }: ModalCrearReservaProps) {
  const { t } = useTranslation();

  const {
    pasoActual,
    avanzar,
    retroceder,
    formData,
    updateCliente,
    updateVehiculo,
    updateOpciones,
    updateNotas,
    updateOrigen,
    erroresCliente,
    erroresVehiculo,
    apiError,
    sucursales,
    isLoadingSucursales,
    recargos,
    coberturas,
    isLoadingRecargos,
    isLoadingCoberturas,
    cotizacion,
    isCotizando,
    cotizacionError,
    crearReserva,
    isCreating,
    origenOptions,
    resetWizard,
  } = useCrearReserva(onClose);

  useEffect(() => {
    if (isOpen) resetWizard();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl">
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6">
          <h2 className="text-lg font-semibold text-text">
            {t('alquileres.wizard.titulo')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator pasoActual={pasoActual} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {pasoActual === 'cliente' && (
            <PasoCliente
              data={formData.cliente}
              errors={erroresCliente}
              onChange={updateCliente}
            />
          )}

          {pasoActual === 'vehiculo' && (
            <PasoVehiculo
              data={formData.vehiculo}
              errors={erroresVehiculo}
              sucursales={sucursales}
              isLoadingSucursales={isLoadingSucursales}
              onChange={updateVehiculo}
            />
          )}

          {pasoActual === 'opciones' && (
            <PasoOpciones
              data={formData.opciones}
              recargos={recargos}
              coberturas={coberturas}
              isLoadingRecargos={isLoadingRecargos}
              isLoadingCoberturas={isLoadingCoberturas}
              cotizacion={cotizacion}
              isCotizando={isCotizando}
              cotizacionError={cotizacionError}
              onChange={updateOpciones}
            />
          )}

          {pasoActual === 'resumen' && (
            <PasoResumen
              formData={formData}
              cotizacion={cotizacion}
              isCotizando={isCotizando}
              origenOptions={origenOptions}
              onNotasChange={updateNotas}
              onOrigenChange={updateOrigen}
            />
          )}
        </div>

        {/* Error banner */}
        <div className="px-6">
          <ApiErrorBanner error={apiError} jiraLabel="Error crear reserva" onReportClick={handleClose} />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 pb-6 pt-4 border-t border-border">
          <div>
            {pasoActual !== 'cliente' && (
              <Button
                type="button"
                variant="ghost"
                onClick={retroceder}
                disabled={isCreating}
              >
                {t('alquileres.wizard.navegacion.anterior')}
              </Button>
            )}
          </div>
          <div>
            {pasoActual !== 'resumen' ? (
              <Button onClick={avanzar}>
                {t('alquileres.wizard.navegacion.siguiente')}
              </Button>
            ) : (
              <Button
                onClick={crearReserva}
                disabled={isCreating || isCotizando}
              >
                {isCreating
                  ? t('alquileres.wizard.navegacion.creando')
                  : t('alquileres.wizard.navegacion.crearReserva')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
