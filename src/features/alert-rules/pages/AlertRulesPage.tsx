import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Power,
  Pencil,
  Trash2,
  Gauge,
  MapPin,
  WifiOff,
  Thermometer,
  Battery,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Spinner,
  EstadoError,
  EstadoVacio,
  ConfirmationModal,
} from '@/shared/ui';
import { useAlertRules } from '../hooks/useAlertRules';
import { TipoReglaAlerta, TipoNotificacion } from '../types';
import type { ReglaAlertaDto, CreateReglaAlertaCommand } from '../types';
import { AlertRuleFormModal } from '../components/AlertRuleFormModal';

function useRuleTypeConfig() {
  const { t } = useTranslation();

  const config: Record<TipoReglaAlerta, { label: string; icon: typeof Gauge; color: string }> = {
    [TipoReglaAlerta.VelocidadMaxima]: { label: t('alertRules.types.speedMax'), icon: Gauge, color: 'text-warning bg-warning/10' },
    [TipoReglaAlerta.DetencionExcesiva]: { label: t('alertRules.types.excessiveStop'), icon: Clock, color: 'text-primary bg-primary/10' },
    [TipoReglaAlerta.EntradaGeocerca]: { label: t('alertRules.types.geofenceEntry'), icon: MapPin, color: 'text-success bg-success/10' },
    [TipoReglaAlerta.SalidaGeocerca]: { label: t('alertRules.types.geofenceExit'), icon: MapPin, color: 'text-error bg-error/10' },
    [TipoReglaAlerta.Desconexion]: { label: t('alertRules.types.disconnection'), icon: WifiOff, color: 'text-text-muted bg-surface' },
    [TipoReglaAlerta.RpmFueraDeRango]: { label: t('alertRules.types.rpmOutOfRange'), icon: Gauge, color: 'text-error bg-error/10' },
    [TipoReglaAlerta.TemperaturaMotorAlta]: { label: t('alertRules.types.highEngineTemp'), icon: Thermometer, color: 'text-error bg-error/10' },
    [TipoReglaAlerta.BateriaBaja]: { label: t('alertRules.types.lowBattery'), icon: Battery, color: 'text-warning bg-warning/10' },
  };

  return config;
}

function useSeverityBadge() {
  const { t } = useTranslation();
  return (severidad: TipoNotificacion) => {
    switch (severidad) {
      case TipoNotificacion.Error:
      case TipoNotificacion.SystemAlert:
        return <Badge variant="error">{t('alertRules.severity.critical')}</Badge>;
      case TipoNotificacion.Warning:
        return <Badge variant="warning">{t('alertRules.severity.warning')}</Badge>;
      default:
        return <Badge variant="info">{t('alertRules.severity.info')}</Badge>;
    }
  };
}

export function AlertRulesPage() {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(true);
  const [formModal, setFormModal] = useState<{ open: boolean; rule?: ReglaAlertaDto }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ReglaAlertaDto | null>(null);

  const {
    rules,
    totalRegistros,
    totalPaginas,
    paginaActual,
    isLoading,
    error,
    refetch,
    setPage,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
  } = useAlertRules({ soloActivas: showAll ? undefined : true });

  const ruleTypeConfig = useRuleTypeConfig();
  const getSeverityBadge = useSeverityBadge();

  const handleSave = (command: CreateReglaAlertaCommand) => {
    if (formModal.rule) {
      updateRule.mutate(
        { id: formModal.rule.id, command: { ...command, id: formModal.rule.id } },
        { onSuccess: () => setFormModal({ open: false }) },
      );
    } else {
      createRule.mutate(command, {
        onSuccess: () => setFormModal({ open: false }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRule.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const parseConfig = (json: string): Record<string, unknown> => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  const formatConfigSummary = (rule: ReglaAlertaDto): string => {
    const config = parseConfig(rule.configuracionJson);
    switch (rule.tipo) {
      case TipoReglaAlerta.VelocidadMaxima:
        return `${config.velocidadMaxKmh ?? '?'} km/h`;
      case TipoReglaAlerta.DetencionExcesiva:
        return `${config.minutosTolerados ?? '?'} min`;
      case TipoReglaAlerta.Desconexion:
        return `${config.segundosTolerados ?? '?'} seg`;
      case TipoReglaAlerta.RpmFueraDeRango:
        return `${config.rpmMinimo ?? '?'} - ${config.rpmMaximo ?? '?'} RPM`;
      case TipoReglaAlerta.TemperaturaMotorAlta:
        return `${config.temperaturaCelsius ?? '?'}°C`;
      case TipoReglaAlerta.BateriaBaja:
        return `${config.porcentajeMinimo ?? '?'}%`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alertRules.title')}</h1>
          <p className="text-text-muted mt-1">{t('alertRules.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
            title={t('common.refresh')}
          >
            <RefreshCw size={18} />
          </button>
          <Button variant="primary" onClick={() => setFormModal({ open: true })}>
            <Plus size={16} className="mr-2" />
            {t('alertRules.create')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Button
          variant={showAll ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setShowAll(true); setPage(1); }}
        >
          {t('alertRules.filters.all')} ({totalRegistros})
        </Button>
        <Button
          variant={!showAll ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setShowAll(false); setPage(1); }}
        >
          {t('alertRules.filters.activeOnly')}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <EstadoError mensaje={t('alertRules.errorLoading')} onReintentar={refetch} />
      ) : rules.length === 0 ? (
        <EstadoVacio
          titulo={t('alertRules.empty')}
          descripcion={t('alertRules.emptyDesc')}
          icono={<AlertTriangle className="w-16 h-16" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => {
            const typeConfig = ruleTypeConfig[rule.tipo];
            const TypeIcon = typeConfig?.icon ?? AlertTriangle;
            const configSummary = formatConfigSummary(rule);

            return (
              <Card key={rule.id} className={!rule.activo ? 'opacity-60' : ''}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${typeConfig?.color ?? 'bg-surface text-text-muted'}`}>
                    <TypeIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text truncate">{rule.nombre}</h3>
                    </div>
                    <p className="text-sm text-text-muted">{typeConfig?.label}</p>
                    {configSummary && (
                      <p className="text-sm font-medium text-text mt-1">{configSummary}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {getSeverityBadge(rule.severidad)}
                  <Badge variant={rule.activo ? 'success' : 'default'} size="sm">
                    {rule.activo ? t('alertRules.active') : t('alertRules.inactive')}
                  </Badge>
                  {rule.notificarEmail && (
                    <Badge variant="info" size="sm">{t('alertRules.channels.email')}</Badge>
                  )}
                  {rule.notificarPush && (
                    <Badge variant="info" size="sm">{t('alertRules.channels.push')}</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule.mutate(rule.id)}
                    disabled={toggleRule.isPending}
                    title={rule.activo ? t('alertRules.deactivate') : t('alertRules.activate')}
                  >
                    <Power size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormModal({ open: true, rule })}
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(rule)}
                    title={t('common.delete')}
                  >
                    <Trash2 size={14} className="text-error" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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

      {/* Form Modal */}
      <AlertRuleFormModal
        isOpen={formModal.open}
        rule={formModal.rule}
        onClose={() => setFormModal({ open: false })}
        onSave={handleSave}
        isSaving={createRule.isPending || updateRule.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('alertRules.confirmDelete')}
        description={t('alertRules.confirmDeleteDesc', { name: deleteTarget?.nombre })}
        variant="danger"
        isLoading={deleteRule.isPending}
      />
    </div>
  );
}
