import { Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrandingPublico } from '@/features/alquiler-publico/hooks/useBrandingPublico';

export function FooterAlquiler() {
  const { t } = useTranslation();
  const { branding } = useBrandingPublico();
  const anioActual = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container-app py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.organizacionNombre}
                className="h-5 w-auto"
              />
            ) : (
              <Car className="w-5 h-5" />
            )}
            <span className="font-semibold">{branding.organizacionNombre}</span>
          </div>

          <p className="text-sm text-text-muted">
            © {anioActual} {branding.organizacionNombre}. {t('alquilerPublico.footer.derechosReservados')}
          </p>
        </div>
      </div>
    </footer>
  );
}
