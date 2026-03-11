import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';
import { Card, CardHeader, Badge, Button, Spinner } from '@/shared/ui';
import type { ContratoAlquilerDto } from '../types/contrato';

interface ContratoReservaCardProps {
  contrato: ContratoAlquilerDto | null;
  isLoading: boolean;
  onPreviewGenerar: () => void;
  onDescargarPdf: (contratoId: string) => void;
  isGenerando: boolean;
  puedeConfigurar: boolean;
}

export function ContratoReservaCard({
  contrato,
  isLoading,
  onPreviewGenerar,
  onDescargarPdf,
  isGenerando,
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
          {/* Info del contrato */}
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <span className="text-sm font-medium text-text">{contrato.numeroContrato}</span>
            <Badge variant={contrato.firmaCliente ? 'success' : 'warning'}>
              {contrato.firmaCliente
                ? t('alquileres.reservaDetalle.contrato.firmado')
                : t('alquileres.reservaDetalle.contrato.sinFirma')
              }
            </Badge>
          </div>

          {/* Fecha firma */}
          {contrato.firmaCliente && contrato.fechaFirma && (
            <p className="text-xs text-text-muted">
              {t('alquileres.reservaDetalle.contrato.fechaFirma')}: {contrato.fechaFirma.split('T')[0]}
            </p>
          )}

          {/* Descargar PDF */}
          <Button
            variant="outline"
            onClick={() => onDescargarPdf(contrato.id)}
            className="w-full text-xs"
          >
            <Download size={14} className="mr-1" />
            {t('alquileres.reservaDetalle.contrato.descargarPdf')}
          </Button>
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
                : t('alquileres.reservaDetalle.contrato.generar')
              }
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
