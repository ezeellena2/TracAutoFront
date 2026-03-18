import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Send } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Spinner } from '@/shared/ui';
import type { ContratoAlquilerDto } from '../types/contrato';
import { EstadoFirmaDigital } from '../types/contrato';

interface ContratoReservaCardProps {
  contrato: ContratoAlquilerDto | null;
  isLoading: boolean;
  onPreviewGenerar: () => void;
  onDescargarPdf: (contratoId: string) => void;
  onEnviarFirmaDigital: (contratoId: string) => void;
  isGenerando: boolean;
  isEnviandoFirmaDigital: boolean;
  puedeConfigurar: boolean;
}

function getFirmaBadge(contrato: ContratoAlquilerDto, t: (key: string) => string) {
  if (contrato.firmaCliente) {
    return { variant: 'success' as const, label: t('alquileres.reservaDetalle.contrato.firmado') };
  }

  switch (contrato.estadoFirmaDigital) {
    case EstadoFirmaDigital.Enviado:
      return { variant: 'info' as const, label: t('alquileres.reservaDetalle.contrato.firmaDigitalEnProceso') };
    case EstadoFirmaDigital.Rechazado:
      return { variant: 'error' as const, label: t('alquileres.reservaDetalle.contrato.firmaDigitalRechazada') };
    case EstadoFirmaDigital.Expirado:
      return { variant: 'warning' as const, label: t('alquileres.reservaDetalle.contrato.firmaDigitalExpirada') };
    case EstadoFirmaDigital.Error:
      return { variant: 'error' as const, label: t('alquileres.reservaDetalle.contrato.firmaDigitalConError') };
    default:
      return { variant: 'warning' as const, label: t('alquileres.reservaDetalle.contrato.sinFirma') };
  }
}

export const ContratoReservaCard = memo(function ContratoReservaCard({
  contrato,
  isLoading,
  onPreviewGenerar,
  onDescargarPdf,
  onEnviarFirmaDigital,
  isGenerando,
  isEnviandoFirmaDigital,
  puedeConfigurar,
}: ContratoReservaCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.contrato.titulo')} />

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : contrato ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText size={16} className="text-primary" />
            <span className="text-sm font-medium text-text">{contrato.numeroContrato}</span>
            <Badge variant={getFirmaBadge(contrato, t).variant}>{getFirmaBadge(contrato, t).label}</Badge>
          </div>

          {contrato.firmaCliente && contrato.fechaFirma && (
            <p className="text-xs text-text-muted">
              {t('alquileres.reservaDetalle.contrato.fechaFirma')}: {contrato.fechaFirma.split('T')[0]}
            </p>
          )}

          {!contrato.firmaCliente && contrato.fechaEnvioFirmaDigital && (
            <p className="text-xs text-text-muted">
              {t('alquileres.reservaDetalle.contrato.fechaEnvioFirmaDigital')}: {contrato.fechaEnvioFirmaDigital.split('T')[0]}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => onDescargarPdf(contrato.id)}
              className="w-full text-xs"
            >
              <Download size={14} className="mr-1" />
              {t('alquileres.reservaDetalle.contrato.descargarPdf')}
            </Button>

            {puedeConfigurar && !contrato.firmaCliente && contrato.estadoFirmaDigital !== EstadoFirmaDigital.Enviado && (
              <Button
                variant="secondary"
                onClick={() => onEnviarFirmaDigital(contrato.id)}
                disabled={isEnviandoFirmaDigital}
                className="w-full text-xs"
              >
                <Send size={14} className="mr-1" />
                {isEnviandoFirmaDigital
                  ? t('alquileres.reservaDetalle.contrato.enviandoFirmaDigital')
                  : t(
                    contrato.estadoFirmaDigital === EstadoFirmaDigital.Rechazado ||
                    contrato.estadoFirmaDigital === EstadoFirmaDigital.Expirado ||
                    contrato.estadoFirmaDigital === EstadoFirmaDigital.Error
                      ? 'alquileres.reservaDetalle.contrato.reenviarFirmaDigital'
                      : 'alquileres.reservaDetalle.contrato.enviarFirmaDigital'
                  )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-text-muted mb-3">{t('alquileres.reservaDetalle.contrato.sinContrato')}</p>
          {puedeConfigurar && (
            <Button
              variant="outline"
              onClick={onPreviewGenerar}
              disabled={isGenerando}
            >
              {isGenerando
                ? t('alquileres.reservaDetalle.contrato.generando')
                : t('alquileres.reservaDetalle.contrato.generar')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
});
