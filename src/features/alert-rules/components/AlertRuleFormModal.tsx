import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { TipoReglaAlerta, TipoNotificacion } from '../types';
import type { ReglaAlertaDto, CreateReglaAlertaCommand } from '../types';

interface AlertRuleFormModalProps {
  isOpen: boolean;
  rule?: ReglaAlertaDto;
  onClose: () => void;
  onSave: (command: CreateReglaAlertaCommand) => void;
  isSaving: boolean;
}

const RULE_TYPES = [
  TipoReglaAlerta.VelocidadMaxima,
  TipoReglaAlerta.DetencionExcesiva,
  TipoReglaAlerta.EntradaGeocerca,
  TipoReglaAlerta.SalidaGeocerca,
  TipoReglaAlerta.Desconexion,
  TipoReglaAlerta.RpmFueraDeRango,
  TipoReglaAlerta.TemperaturaMotorAlta,
  TipoReglaAlerta.BateriaBaja,
];

const SEVERITIES = [
  TipoNotificacion.Info,
  TipoNotificacion.Warning,
  TipoNotificacion.Error,
];

function parseConfig(json: string | undefined): Record<string, number | string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function AlertRuleFormModal({ isOpen, rule, onClose, onSave, isSaving }: AlertRuleFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!rule;

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoReglaAlerta>(TipoReglaAlerta.VelocidadMaxima);
  const [severidad, setSeveridad] = useState<TipoNotificacion>(TipoNotificacion.Warning);
  const [cooldown, setCooldown] = useState(300);
  const [notificarInApp, setNotificarInApp] = useState(true);
  const [notificarEmail, setNotificarEmail] = useState(false);
  const [notificarPush, setNotificarPush] = useState(false);

  // Dynamic config fields
  const [velocidadMaxKmh, setVelocidadMaxKmh] = useState(120);
  const [minutosTolerados, setMinutosTolerados] = useState(30);
  const [segundosTolerados, setSegundosTolerados] = useState(300);
  const [rpmMinimo, setRpmMinimo] = useState(800);
  const [rpmMaximo, setRpmMaximo] = useState(6000);
  const [temperaturaCelsius, setTemperaturaCelsius] = useState(110);
  const [porcentajeMinimo, setPorcentajeMinimo] = useState(20);

  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setNombre(rule.nombre);
        setTipo(rule.tipo);
        setSeveridad(rule.severidad);
        setCooldown(rule.cooldownSegundos);
        setNotificarInApp(rule.notificarInApp);
        setNotificarEmail(rule.notificarEmail);
        setNotificarPush(rule.notificarPush);

        const config = parseConfig(rule.configuracionJson);
        if (config.velocidadMaxKmh) setVelocidadMaxKmh(Number(config.velocidadMaxKmh));
        if (config.minutosTolerados) setMinutosTolerados(Number(config.minutosTolerados));
        if (config.segundosTolerados) setSegundosTolerados(Number(config.segundosTolerados));
        if (config.rpmMinimo) setRpmMinimo(Number(config.rpmMinimo));
        if (config.rpmMaximo) setRpmMaximo(Number(config.rpmMaximo));
        if (config.temperaturaCelsius) setTemperaturaCelsius(Number(config.temperaturaCelsius));
        if (config.porcentajeMinimo) setPorcentajeMinimo(Number(config.porcentajeMinimo));
      } else {
        setNombre('');
        setTipo(TipoReglaAlerta.VelocidadMaxima);
        setSeveridad(TipoNotificacion.Warning);
        setCooldown(300);
        setNotificarInApp(true);
        setNotificarEmail(false);
        setNotificarPush(false);
        setVelocidadMaxKmh(120);
        setMinutosTolerados(30);
        setSegundosTolerados(300);
        setRpmMinimo(800);
        setRpmMaximo(6000);
        setTemperaturaCelsius(110);
        setPorcentajeMinimo(20);
      }
    }
  }, [isOpen, rule]);

  const buildConfigJson = (): string => {
    switch (tipo) {
      case TipoReglaAlerta.VelocidadMaxima:
        return JSON.stringify({ velocidadMaxKmh });
      case TipoReglaAlerta.DetencionExcesiva:
        return JSON.stringify({ minutosTolerados });
      case TipoReglaAlerta.EntradaGeocerca:
      case TipoReglaAlerta.SalidaGeocerca:
        return JSON.stringify({});
      case TipoReglaAlerta.Desconexion:
        return JSON.stringify({ segundosTolerados });
      case TipoReglaAlerta.RpmFueraDeRango:
        return JSON.stringify({ rpmMinimo, rpmMaximo });
      case TipoReglaAlerta.TemperaturaMotorAlta:
        return JSON.stringify({ temperaturaCelsius });
      case TipoReglaAlerta.BateriaBaja:
        return JSON.stringify({ porcentajeMinimo });
      default:
        return '{}';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nombre,
      tipo,
      configuracionJson: buildConfigJson(),
      severidad,
      cooldownSegundos: cooldown,
      notificarInApp,
      notificarSignalR: true,
      notificarPush,
      notificarEmail,
    });
  };

  const ruleTypeLabel = (t_: TipoReglaAlerta): string => {
    const labels: Record<number, string> = {
      [TipoReglaAlerta.VelocidadMaxima]: t('alertRules.types.speedMax'),
      [TipoReglaAlerta.DetencionExcesiva]: t('alertRules.types.excessiveStop'),
      [TipoReglaAlerta.EntradaGeocerca]: t('alertRules.types.geofenceEntry'),
      [TipoReglaAlerta.SalidaGeocerca]: t('alertRules.types.geofenceExit'),
      [TipoReglaAlerta.Desconexion]: t('alertRules.types.disconnection'),
      [TipoReglaAlerta.RpmFueraDeRango]: t('alertRules.types.rpmOutOfRange'),
      [TipoReglaAlerta.TemperaturaMotorAlta]: t('alertRules.types.highEngineTemp'),
      [TipoReglaAlerta.BateriaBaja]: t('alertRules.types.lowBattery'),
    };
    return labels[t_] ?? String(t_);
  };

  const severityLabel = (s: TipoNotificacion): string => {
    const labels: Record<number, string> = {
      [TipoNotificacion.Info]: t('alertRules.severity.info'),
      [TipoNotificacion.Warning]: t('alertRules.severity.warning'),
      [TipoNotificacion.Error]: t('alertRules.severity.critical'),
    };
    return labels[s] ?? String(s);
  };

  const handleInputChange = (setter: (v: number) => void) => (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } },
  ) => {
    setter(Number(e.target.value));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header
        title={isEdit ? t('alertRules.editTitle') : t('alertRules.createTitle')}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="space-y-4">
            {/* Name */}
            <Input
              label={t('alertRules.form.name')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t('alertRules.form.namePlaceholder')}
              required
              maxLength={200}
            />

            {/* Type + Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('alertRules.form.type')}
                value={String(tipo)}
                onChange={(val) => setTipo(Number(val) as TipoReglaAlerta)}
                options={RULE_TYPES.map((t_) => ({
                  value: String(t_),
                  label: ruleTypeLabel(t_),
                }))}
              />
              <Select
                label={t('alertRules.form.severity')}
                value={String(severidad)}
                onChange={(val) => setSeveridad(Number(val) as TipoNotificacion)}
                options={SEVERITIES.map((s) => ({
                  value: String(s),
                  label: severityLabel(s),
                }))}
              />
            </div>

            {/* Dynamic config by type */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <p className="text-sm font-medium text-text mb-3">{t('alertRules.form.condition')}</p>

              {tipo === TipoReglaAlerta.VelocidadMaxima && (
                <Input
                  label={t('alertRules.form.maxSpeedKmh')}
                  type="number"
                  value={String(velocidadMaxKmh)}
                  onChange={handleInputChange(setVelocidadMaxKmh)}
                  min={1}
                  max={300}
                />
              )}

              {tipo === TipoReglaAlerta.DetencionExcesiva && (
                <Input
                  label={t('alertRules.form.toleratedMinutes')}
                  type="number"
                  value={String(minutosTolerados)}
                  onChange={handleInputChange(setMinutosTolerados)}
                  min={1}
                />
              )}

              {(tipo === TipoReglaAlerta.EntradaGeocerca || tipo === TipoReglaAlerta.SalidaGeocerca) && (
                <p className="text-sm text-text-muted">{t('alertRules.form.geofenceNote')}</p>
              )}

              {tipo === TipoReglaAlerta.Desconexion && (
                <Input
                  label={t('alertRules.form.toleratedSeconds')}
                  type="number"
                  value={String(segundosTolerados)}
                  onChange={handleInputChange(setSegundosTolerados)}
                  min={60}
                />
              )}

              {tipo === TipoReglaAlerta.RpmFueraDeRango && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('alertRules.form.rpmMin')}
                    type="number"
                    value={String(rpmMinimo)}
                    onChange={handleInputChange(setRpmMinimo)}
                    min={0}
                  />
                  <Input
                    label={t('alertRules.form.rpmMax')}
                    type="number"
                    value={String(rpmMaximo)}
                    onChange={handleInputChange(setRpmMaximo)}
                    min={0}
                  />
                </div>
              )}

              {tipo === TipoReglaAlerta.TemperaturaMotorAlta && (
                <Input
                  label={t('alertRules.form.tempCelsius')}
                  type="number"
                  value={String(temperaturaCelsius)}
                  onChange={handleInputChange(setTemperaturaCelsius)}
                  min={50}
                  max={200}
                />
              )}

              {tipo === TipoReglaAlerta.BateriaBaja && (
                <Input
                  label={t('alertRules.form.batteryMinPercent')}
                  type="number"
                  value={String(porcentajeMinimo)}
                  onChange={handleInputChange(setPorcentajeMinimo)}
                  min={1}
                  max={100}
                />
              )}
            </div>

            {/* Cooldown */}
            <Input
              label={t('alertRules.form.cooldown')}
              type="number"
              value={String(cooldown)}
              onChange={handleInputChange(setCooldown)}
              min={60}
              helperText={t('alertRules.form.cooldownHint')}
            />

            {/* Notification channels */}
            <div>
              <p className="text-sm font-medium text-text mb-2">{t('alertRules.form.channels')}</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarInApp}
                    onChange={(e) => setNotificarInApp(e.target.checked)}
                    className="rounded border-border"
                  />
                  {t('alertRules.channels.inApp')}
                </label>
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarEmail}
                    onChange={(e) => setNotificarEmail(e.target.checked)}
                    className="rounded border-border"
                  />
                  {t('alertRules.channels.email')}
                </label>
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarPush}
                    onChange={(e) => setNotificarPush(e.target.checked)}
                    className="rounded border-border"
                  />
                  {t('alertRules.channels.push')}
                </label>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving} disabled={!nombre.trim()}>
            {isEdit ? t('common.save') : t('alertRules.create')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
