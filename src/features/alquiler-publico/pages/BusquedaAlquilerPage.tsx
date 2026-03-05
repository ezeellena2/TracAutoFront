import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Spinner } from '@/shared/ui';
import { BuscadorAlquiler } from '../components/BuscadorAlquiler';
import { CategoriasDestacadas } from '../components/CategoriasDestacadas';
import { useSucursalesPublicas } from '../hooks/useSucursalesPublicas';
import { useBrandingPublico } from '../hooks/useBrandingPublico';

export default function BusquedaAlquilerPage() {
  const { t } = useTranslation();
  const { sucursales, isLoading } = useSucursalesPublicas();
  const { branding } = useBrandingPublico();

  return (
    <>
      <Helmet>
        <title>{branding?.organizacionNombre ?? 'TracAuto'} — {t('alquilerPublico.busqueda.titulo')}</title>
        <meta name="description" content={t('alquilerPublico.seo.busqueda.descripcion')} />
        <meta property="og:title" content={`${branding?.organizacionNombre ?? 'TracAuto'} — ${t('alquilerPublico.busqueda.titulo')}`} />
        <meta property="og:description" content={t('alquilerPublico.seo.busqueda.descripcion')} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AutoRental',
            name: branding?.organizacionNombre ?? 'TracAuto',
            description: t('alquilerPublico.seo.busqueda.descripcion'),
          })}
        </script>
      </Helmet>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-12 md:py-20">
        <div className="container-app">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {t('alquilerPublico.busqueda.titulo')}
            </h1>
            <p className="text-white/80 text-lg">
              {t('alquilerPublico.busqueda.subtitulo')}
            </p>
          </div>

          {/* Buscador */}
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="text-white" />
              </div>
            ) : (
              <BuscadorAlquiler sucursales={sucursales} />
            )}
          </div>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="py-12">
        <div className="container-app">
          <CategoriasDestacadas />
        </div>
      </section>
    </>
  );
}
