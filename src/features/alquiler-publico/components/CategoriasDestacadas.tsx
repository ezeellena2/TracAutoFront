import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car } from 'lucide-react';
import { Card, CardContent, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { useCategoriasPublicas } from '../hooks/useCategoriasPublicas';
import { CATEGORIA_ICONS } from '../constants/categorias';

export function CategoriasDestacadas() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorias, isLoading } = useCategoriasPublicas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (categorias.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-6">
        {t('alquilerPublico.categorias.titulo')}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categorias.map(cat => {
          const Icon = CATEGORIA_ICONS[cat.categoriaAlquiler] ?? Car;
          return (
            <Card
              key={cat.categoriaAlquiler}
              hover
              onClick={() => {
                navigate(`/?categoriaAlquiler=${cat.categoriaAlquiler}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-center"
            >
              <CardContent>
                <div className="flex flex-col items-center gap-3">
                  {cat.imagenUrl ? (
                    <img
                      src={cat.imagenUrl}
                      alt={cat.nombre}
                      className="w-16 h-12 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <h3 className="font-semibold text-text text-sm">{cat.nombre}</h3>
                  <p className="text-primary font-bold text-lg">
                    {cat.precioDesde !== cat.precioHasta
                      ? t('alquilerPublico.categorias.rango', {
                          precioDesde: formatCurrency(cat.precioDesde),
                          precioHasta: formatCurrency(cat.precioHasta),
                        })
                      : t('alquilerPublico.categorias.desde', {
                          precio: formatCurrency(cat.precioDesde),
                        })}
                  </p>
                  <span className="text-xs text-text-muted">
                    {t('alquilerPublico.categorias.disponibles', { count: cat.vehiculosDisponibles })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
