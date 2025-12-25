import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Button } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { toast } from '@/store';
import { useErrorHandler } from '@/hooks';
import { OrganizacionDto } from '@/shared/types/api';

interface CrearRelacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizacionActualId: string;
}

export function CrearRelacionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  organizacionActualId 
}: CrearRelacionModalProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const [organizacionBId, setOrganizacionBId] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState('');
  const [organizaciones, setOrganizaciones] = useState<OrganizacionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');

  // Cargar organizaciones disponibles (excluyendo la actual)
  useEffect(() => {
    if (isOpen) {
      loadOrganizaciones();
    }
  }, [isOpen, filtroNombre]);

  const loadOrganizaciones = async () => {
    try {
      setIsLoadingOrgs(true);
      const result = await organizacionesApi.getOrganizaciones({
        numeroPagina: 1,
        tamanoPagina: 50,
        filtroNombre: filtroNombre || undefined,
        soloActivas: true
      });
      // Filtrar la organización actual
      const orgsFiltradas = result.items.filter(o => o.id !== organizacionActualId);
      setOrganizaciones(orgsFiltradas);
    } catch (err) {
      console.error('Error loading organizations:', err);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await organizacionesApi.crearRelacionOrganizacion(
        organizacionActualId,
        organizacionBId,
        tipoRelacion || undefined
      );
      toast.success(t('organization.relations.success.created'));
      setOrganizacionBId('');
      setTipoRelacion('');
      setFiltroNombre('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOrganizacionBId('');
    setTipoRelacion('');
    setFiltroNombre('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {t('organization.relations.create.title')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('organization.relations.create.searchOrganization')}
            </label>
            <Input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder={t('organization.relations.create.searchPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('organization.relations.create.selectOrganization')}
            </label>
            {isLoadingOrgs ? (
              <div className="text-sm text-text-muted py-2">
                {t('common.loading')}...
              </div>
            ) : (
              <select
                value={organizacionBId}
                onChange={(e) => setOrganizacionBId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">
                  {t('organization.relations.create.selectPlaceholder')}
                </option>
                {organizaciones.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.nombre}
                  </option>
                ))}
              </select>
            )}
            {organizaciones.length === 0 && !isLoadingOrgs && (
              <p className="text-xs text-text-muted mt-1">
                {t('organization.relations.create.noOrganizations')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('organization.relations.create.relationType')} ({t('common.optional')})
            </label>
            <Input
              type="text"
              value={tipoRelacion}
              onChange={(e) => setTipoRelacion(e.target.value)}
              placeholder={t('organization.relations.create.relationTypePlaceholder')}
              maxLength={100}
            />
            <p className="text-xs text-text-muted mt-1">
              {t('organization.relations.create.relationTypeHelp')}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !organizacionBId}
            >
              {isLoading ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

