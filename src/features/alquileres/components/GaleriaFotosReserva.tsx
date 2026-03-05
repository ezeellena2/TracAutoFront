import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Modal, Spinner } from '@/shared/ui';
import { TipoInspeccion } from '../types/reserva';
import type { FotoInspeccionDto } from '../types/reserva';

interface GaleriaFotosReservaProps {
  fotos: FotoInspeccionDto[];
  isLoading: boolean;
}

export function GaleriaFotosReserva({ fotos, isLoading }: GaleriaFotosReservaProps) {
  const { t } = useTranslation();
  const [selectedFoto, setSelectedFoto] = useState<FotoInspeccionDto | null>(null);

  const fotosCheckOut = fotos
    .filter(f => f.tipoInspeccion === TipoInspeccion.CheckOut)
    .sort((a, b) => a.orden - b.orden);

  const fotosCheckIn = fotos
    .filter(f => f.tipoInspeccion === TipoInspeccion.CheckIn)
    .sort((a, b) => a.orden - b.orden);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title={t('alquileres.reservaDetalle.fotos.titulo')} />
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (fotos.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader title={t('alquileres.reservaDetalle.fotos.titulo')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-Out */}
          <div>
            <h4 className="text-sm font-medium text-text mb-2">
              {t('alquileres.reservaDetalle.fotos.checkOut')}
            </h4>
            {fotosCheckOut.length === 0 ? (
              <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.fotos.sinFotos')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotosCheckOut.map(foto => (
                  <button
                    key={foto.id}
                    onClick={() => setSelectedFoto(foto)}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={foto.url}
                      alt={foto.descripcion ?? ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Check-In */}
          <div>
            <h4 className="text-sm font-medium text-text mb-2">
              {t('alquileres.reservaDetalle.fotos.checkIn')}
            </h4>
            {fotosCheckIn.length === 0 ? (
              <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.fotos.sinFotos')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotosCheckIn.map(foto => (
                  <button
                    key={foto.id}
                    onClick={() => setSelectedFoto(foto)}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={foto.url}
                      alt={foto.descripcion ?? ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Lightbox */}
      <Modal isOpen={!!selectedFoto} onClose={() => setSelectedFoto(null)} size="lg">
        {selectedFoto && (
          <div className="p-4">
            <img
              src={selectedFoto.url}
              alt={selectedFoto.descripcion ?? ''}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            {selectedFoto.descripcion && (
              <p className="text-sm text-text-muted mt-2 text-center">{selectedFoto.descripcion}</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
