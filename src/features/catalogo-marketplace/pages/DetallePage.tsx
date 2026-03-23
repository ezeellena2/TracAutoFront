import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Gauge, Phone, Mail, Building2, Star } from 'lucide-react';
import { SpinnerPantalla, EstadoError, Card, CardContent } from '@/shared/ui';
import { useVehiculoDetalle } from '../hooks/useVehiculos';
import { formatearPrecio, formatearKilometraje } from '../utils/formatters';
import { formatDate } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import { useTranslation } from 'react-i18next';

export function DetallePage() {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehiculo, isLoading, isError, error, refetch } = useVehiculoDetalle(id);

  if (isLoading) return <SpinnerPantalla />;

  if (isError || !vehiculo) {
    return (
      <div className="container-app py-8">
        <EstadoError
          mensaje={error instanceof Error ? error.message : t('catalogoMarketplace.vehiculoNoEncontrado')}
          onReintentar={() => refetch()}
        />
      </div>
    );
  }

  const titulo = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || t('catalogoMarketplace.vehiculoDefault');

  const tieneContacto = vehiculo.contacto && (
    vehiculo.contacto.telefono || vehiculo.contacto.email
  );

  return (
    <div className="container-app py-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('catalogoMarketplace.volverCatalogo')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Imagen principal */}
          <Card padding="none">
            <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-xl">
              {vehiculo.imagenPortadaUrl ? (
                <img
                  src={vehiculo.imagenPortadaUrl}
                  alt={titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  {t('catalogoMarketplace.sinImagen')}
                </div>
              )}
              {vehiculo.destacado && (
                <span className="absolute top-4 right-4 bg-primary text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {t('catalogoMarketplace.destacado')}
                </span>
              )}
            </div>

            {/* Galería */}
            {vehiculo.imagenesUrls && vehiculo.imagenesUrls.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {vehiculo.imagenesUrls.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${titulo} - imagen ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Descripción */}
          <Card padding="none">
            <CardContent>
              <h2 className="font-semibold text-lg text-text mb-4">{t('catalogoMarketplace.descripcion')}</h2>
              <p className="text-text-muted whitespace-pre-line">
                {vehiculo.descripcion || t('catalogoMarketplace.sinDescripcion')}
              </p>
            </CardContent>
          </Card>

          {/* Características */}
          <Card padding="none">
            <CardContent>
              <h2 className="font-semibold text-lg text-text mb-4">{t('catalogoMarketplace.caracteristicas')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {vehiculo.anio && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-text-muted">{t('catalogoMarketplace.anio')}</p>
                      <p className="font-medium text-text">{vehiculo.anio}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-muted">
                  <Gauge className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-muted">{t('catalogoMarketplace.kilometraje')}</p>
                    <p className="font-medium text-text">{formatearKilometraje(vehiculo.kilometraje)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card de precio */}
          <Card padding="none">
            <CardContent>
              <h1 className="text-2xl font-bold text-text mb-2">{titulo}</h1>
              <p className="text-3xl font-bold text-primary mt-4">
                {formatearPrecio(vehiculo.precio, vehiculo.moneda, t('catalogoMarketplace.consultarPrecio'))}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {t('catalogoMarketplace.publicadoEl', { date: formatDate(vehiculo.fechaPublicacion, culture, timeZoneId) })}
              </p>
            </CardContent>
          </Card>

          {/* Card de contacto */}
          <Card padding="none">
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-text">{vehiculo.vendedor.nombre}</h2>
              </div>

              <div className="space-y-3">
                {vehiculo.contacto?.telefono && (
                  <a
                    href={`tel:${vehiculo.contacto.telefono}`}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-text">{vehiculo.contacto.telefono}</span>
                  </a>
                )}
                {vehiculo.contacto?.email && (
                  <a
                    href={`mailto:${vehiculo.contacto.email}`}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-text truncate">{vehiculo.contacto.email}</span>
                  </a>
                )}

                {!tieneContacto && (
                  <p className="text-text-muted text-sm text-center py-4">
                    {t('catalogoMarketplace.contactoNoDisponible')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
