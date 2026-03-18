import { useTranslation } from 'react-i18next';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, Button, Spinner, EstadoVacio, EstadoError } from '@/shared/ui';
import { useFavoritos, useToggleFavorito } from '../hooks/useFavoritos';
import { formatearPrecio, formatearKilometraje } from '../utils/formatters';

export function FavoritosPage() {
  const { t } = useTranslation();
  const {
    favoritos,
    totalPaginas,
    paginaActual,
    isLoading,
    error,
    setPage,
  } = useFavoritos();

  const { toggle } = useToggleFavorito();

  return (
    <div className="container-app py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('catalogoMarketplace.favoritos.titulo')}</h1>
        <p className="text-text-muted mt-1">{t('catalogoMarketplace.favoritos.subtitulo')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <EstadoError
          mensaje={t('catalogoMarketplace.favoritos.errorCarga')}
          onReintentar={() => setPage(1)}
        />
      ) : favoritos.length === 0 ? (
        <EstadoVacio
          titulo={t('catalogoMarketplace.favoritos.vacio')}
          descripcion={t('catalogoMarketplace.favoritos.vacioDesc')}
          icono={<Heart className="w-16 h-16" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritos.map((fav) => (
              <Card key={fav.id} className="flex flex-col">
                <CardContent className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-text text-lg">
                        {[fav.marca, fav.modelo].filter(Boolean).join(' ')}
                      </h3>
                      {fav.anio && (
                        <p className="text-sm text-text-muted">{fav.anio}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggle(fav.vehiculoPublicacionId)}
                      className="p-1.5 rounded-full hover:bg-error/10 transition-colors"
                      aria-label={t('catalogoMarketplace.favoritos.quitar')}
                    >
                      <Heart size={18} className="fill-error text-error" />
                    </button>
                  </div>

                  <p className="text-primary font-bold text-xl mt-2">
                    {formatearPrecio(fav.precio, fav.moneda, t('catalogoMarketplace.consultarPrecio'))}
                  </p>

                  <p className="text-sm text-text-muted mt-1">
                    {formatearKilometraje(fav.kilometraje)}
                  </p>

                  {fav.descripcion && (
                    <p className="text-sm text-text-muted mt-2 line-clamp-2">{fav.descripcion}</p>
                  )}

                  <p className="text-xs text-text-muted mt-3 pt-2 border-t border-border">
                    {fav.concesionariaNombre}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setPage(paginaActual - 1)} disabled={paginaActual <= 1}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-text-muted">
                {t('common.pageOf', { current: paginaActual, total: totalPaginas })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPage(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
