/**
 * Página 404 - Recurso no encontrado
 * Se muestra cuando el usuario navega a una ruta inexistente
 */

import { useNavigate } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ilustración */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* Código de error */}
        <h1 className="text-7xl font-bold text-primary mb-4">404</h1>

        {/* Título y descripción */}
        <h2 className="text-2xl font-semibold text-text mb-2">
          {t('errorPages.notFound.title', 'Página no encontrada')}
        </h2>
        <p className="text-text-muted mb-8">
          {t('errorPages.notFound.message', 'La página que buscás no existe o fue movida.')}
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.goBack', 'Volver')}
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('common.goHome', 'Ir al Inicio')}
          </Button>
        </div>
      </div>
    </div>
  );
}
