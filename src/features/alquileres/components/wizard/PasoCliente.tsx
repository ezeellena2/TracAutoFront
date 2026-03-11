import { useTranslation } from 'react-i18next';
import { UserPlus, Search } from 'lucide-react';
import { Input, Select, Button } from '@/shared/ui';
import { TIPO_DOCUMENTO_VALUES } from '../../types/cliente';
import type { ClienteAlquilerDto } from '../../types/cliente';
import type { WizardClienteData, WizardClienteErrors } from '../../types/wizard';
import { BuscadorCliente } from './BuscadorCliente';

interface PasoClienteProps {
  data: WizardClienteData;
  errors: WizardClienteErrors;
  onChange: (partial: Partial<WizardClienteData>) => void;
}

export function PasoCliente({ data, errors, onChange }: PasoClienteProps) {
  const { t } = useTranslation();

  const tipoDocOptions = TIPO_DOCUMENTO_VALUES
    .map(v => ({ value: v, label: t(`alquileres.wizard.cliente.tiposDocumento.${v}`) }));

  const handleSelectCliente = (cliente: ClienteAlquilerDto) => {
    onChange({
      clienteExistenteId: cliente.id,
      clienteExistente: cliente,
      creandoNuevo: false,
    });
  };

  const handleClearCliente = () => {
    onChange({
      clienteExistenteId: null,
      clienteExistente: null,
    });
  };

  const toggleMode = () => {
    onChange({
      creandoNuevo: !data.creandoNuevo,
      clienteExistenteId: null,
      clienteExistente: null,
    });
  };

  return (
    <div className="px-6 space-y-5">
      <h3 className="text-base font-semibold text-text">
        {t('alquileres.wizard.cliente.titulo')}
      </h3>

      {/* Toggle modo */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!data.creandoNuevo ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => data.creandoNuevo && toggleMode()}
        >
          <Search size={14} className="mr-1.5" />
          {t('alquileres.wizard.cliente.usarExistente')}
        </Button>
        <Button
          type="button"
          variant={data.creandoNuevo ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => !data.creandoNuevo && toggleMode()}
        >
          <UserPlus size={14} className="mr-1.5" />
          {t('alquileres.wizard.cliente.crearNuevo')}
        </Button>
      </div>

      {!data.creandoNuevo ? (
        /* Modo buscar existente */
        <BuscadorCliente
          clienteSeleccionado={data.clienteExistente}
          onSelect={handleSelectCliente}
          onClear={handleClearCliente}
          error={errors.clienteExistente}
        />
      ) : (
        /* Modo crear nuevo */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('alquileres.wizard.cliente.nombre')}
              value={data.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.nombrePlaceholder')}
              error={errors.nombre}
              required
            />
            <Input
              label={t('alquileres.wizard.cliente.apellido')}
              value={data.apellido}
              onChange={(e) => onChange({ apellido: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.apellidoPlaceholder')}
              error={errors.apellido}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('alquileres.wizard.cliente.email')}
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.emailPlaceholder')}
              error={errors.email}
              required
            />
            <Input
              label={t('alquileres.wizard.cliente.telefono')}
              value={data.telefono}
              onChange={(e) => onChange({ telefono: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.telefonoPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('alquileres.wizard.cliente.tipoDocumento')}
              value={data.tipoDocumento}
              onChange={(v) => onChange({ tipoDocumento: Number(v) })}
              options={tipoDocOptions}
              placeholder={t('alquileres.wizard.cliente.tipoDocumentoPlaceholder')}
              error={errors.tipoDocumento}
              required
            />
            <Input
              label={t('alquileres.wizard.cliente.numeroDocumento')}
              value={data.numeroDocumento}
              onChange={(e) => onChange({ numeroDocumento: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.numeroDocumentoPlaceholder')}
              error={errors.numeroDocumento}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t('alquileres.wizard.cliente.fechaNacimiento')}
              type="date"
              value={data.fechaNacimiento}
              onChange={(e) => onChange({ fechaNacimiento: e.target.value })}
            />
            <Input
              label={t('alquileres.wizard.cliente.licenciaConducir')}
              value={data.numeroLicenciaConducir}
              onChange={(e) => onChange({ numeroLicenciaConducir: e.target.value })}
              placeholder={t('alquileres.wizard.cliente.licenciaPlaceholder')}
            />
            <Input
              label={t('alquileres.wizard.cliente.vencimientoLicencia')}
              type="date"
              value={data.vencimientoLicencia}
              onChange={(e) => onChange({ vencimientoLicencia: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
