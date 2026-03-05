import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '@/shared/ui';
import { ClienteDetalleModal } from './ClienteDetalleModal';

interface ClienteReservaCardProps {
  nombreCompleto: string;
  clienteId: string;
}

export function ClienteReservaCard({ nombreCompleto, clienteId }: ClienteReservaCardProps) {
  const { t } = useTranslation();
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader title={t('alquileres.reservaDetalle.cliente.titulo')} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">{nombreCompleto}</p>
          </div>
          <button
            onClick={() => setIsDetalleOpen(true)}
            className="text-primary hover:text-primary/80 transition-colors shrink-0"
            title={t('alquileres.clientes.tabla.verDetalle')}
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </Card>

      <ClienteDetalleModal
        isOpen={isDetalleOpen}
        clienteId={clienteId}
        onClose={() => setIsDetalleOpen(false)}
      />
    </>
  );
}
