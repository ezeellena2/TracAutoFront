import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Power, PowerOff, Package } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmationModal,
  EstadoError,
  Spinner,
} from '@/shared/ui';
import { useSuscripcionesData } from '../hooks/useSubscriptionData';
import type { ModuloDisponibleDto } from '../types';

export function SuscripcionPage() {
  const { t } = useTranslation();
  const {
    modulosActivos,
    modulosDisponibles,
    isLoading,
    error,
    activarModulo,
    desactivarModulo,
    refetch,
  } = useSuscripcionesData();
  const [pendingAction, setPendingAction] = useState<{ modulo: ModuloDisponibleDto; action: 'activate' | 'deactivate' } | null>(null);

  const activos = useMemo(
    () => new Set(modulosActivos.map(modulo => modulo.codigo)),
    [modulosActivos],
  );

  const handleConfirm = () => {
    if (!pendingAction) return;

    const mutation = pendingAction.action === 'activate' ? activarModulo : desactivarModulo;
    mutation.mutate(pendingAction.modulo.codigo, {
      onSuccess: () => setPendingAction(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <EstadoError mensaje={(error as Error).message ?? t('common.error')} onReintentar={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('subscription.title')}</h1>
        <p className="text-text-muted mt-1">{t('subscription.subtitle')}</p>
      </div>

      <Alert
        type="info"
        message="Suscripciones ahora solo administra los modulos activos de la organizacion."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {modulosDisponibles.map(modulo => {
          const isActive = activos.has(modulo.codigo) || modulo.estaActivo;
          const isBlocked = !modulo.cumplePrerequisitos;

          return (
            <Card key={modulo.codigo}>
              <CardHeader
                title={modulo.nombre}
                subtitle={modulo.descripcion}
              />
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isActive ? 'success' : 'default'}>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {modulo.esBase && <Badge variant="info">Base</Badge>}
                  {modulo.esGratis && <Badge variant="info">Incluido</Badge>}
                </div>

                {isBlocked && modulo.prerequisitosFaltantes.length > 0 && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-text-muted">
                    <p className="font-medium text-text mb-1">Prerequisitos faltantes</p>
                    <ul className="space-y-1">
                      {modulo.prerequisitosFaltantes.map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Package size={16} />
                    <span>{isActive ? 'Disponible para uso' : 'Desactivado para esta organización'}</span>
                  </div>

                  {isActive ? (
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction({ modulo, action: 'deactivate' })}
                      disabled={desactivarModulo.isPending || modulo.esBase}
                    >
                      <PowerOff size={16} className="mr-2" />
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setPendingAction({ modulo, action: 'activate' })}
                      disabled={activarModulo.isPending || isBlocked}
                    >
                      <Power size={16} className="mr-2" />
                      Activar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Módulos activos"
          subtitle="Resumen del estado actual de la organización."
        />
        <div className="flex flex-wrap gap-2">
          {modulosActivos.length > 0 ? (
            modulosActivos.map(modulo => (
              <Badge key={modulo.codigo} variant="success">
                <Check size={14} className="mr-1" />
                {modulo.nombre}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-text-muted">No hay módulos activos fuera del core base.</p>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={pendingAction != null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title={pendingAction?.action === 'activate' ? 'Activar módulo' : 'Desactivar módulo'}
        description={
          pendingAction
            ? `${pendingAction.action === 'activate' ? 'Se activará' : 'Se desactivará'} ${pendingAction.modulo.nombre} para esta organización.`
            : ''
        }
        variant={pendingAction?.action === 'activate' ? 'info' : 'warning'}
        isLoading={activarModulo.isPending || desactivarModulo.isPending}
      />
    </div>
  );
}

