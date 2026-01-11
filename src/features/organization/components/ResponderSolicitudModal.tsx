import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, XCircle } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { toast } from '@/store';
import { useErrorHandler } from '@/hooks';
import { OrganizacionRelacionDto, TipoRecurso } from '@/shared/types/api';

interface ResponderSolicitudModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    solicitud: OrganizacionRelacionDto | null;
}

export function ResponderSolicitudModal({
    isOpen,
    onClose,
    onSuccess,
    solicitud
}: ResponderSolicitudModalProps) {
    const { t } = useTranslation();
    const { getErrorMessage } = useErrorHandler();
    const [isLoading, setIsLoading] = useState(false);
    const [compartirRecursos, setCompartirRecursos] = useState(true);

    if (!solicitud) return null;

    const handleResponder = async (aceptar: boolean) => {
        setIsLoading(true);
        try {
            // Si aceptamos y marcamos compartir, enviamos los recursos. Si rechazamos, lista vacía.
            const recursos = (aceptar && compartirRecursos)
                ? [TipoRecurso.Vehiculo, TipoRecurso.Conductor, TipoRecurso.DispositivoTraccar]
                : [];

            await organizacionesApi.responderSolicitudVinculacion({
                relacionId: solicitud.id,
                aceptar,
                recursosACompartir: recursos,
            });

            const messageKey = aceptar
                ? 'organization.relations.success.accepted'
                : 'organization.relations.success.rejected';

            toast.success(t(messageKey));
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-text">
                        {t('organization.relations.respond.title', 'Responder Solicitud')}
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-text mb-2">
                        {t('organization.relations.respond.organizationWantsToLink', {
                            name: solicitud.solicitanteOrganizacionNombre
                        }).split('<strong>')[0]}
                        <strong>{solicitud.solicitanteOrganizacionNombre}</strong>
                        {t('organization.relations.respond.organizationWantsToLink', {
                            name: solicitud.solicitanteOrganizacionNombre
                        }).split('</strong>')[1]}
                    </p>
                    <div className="bg-background-secondary p-3 rounded-lg border border-border">
                        <p className="text-sm text-text-muted">
                            {t('organization.relations.respond.acceptDescription')}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={compartirRecursos}
                            onChange={(e) => setCompartirRecursos(e.target.checked)}
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm font-medium text-text">
                            {t('organization.relations.respond.shareResources', 'Compartir mis recursos a esta organización')}
                        </span>
                    </label>
                    <p className="text-xs text-text-muted mt-1 ml-6">
                        {t('organization.relations.respond.shareResourcesDescription', {
                            name: solicitud.solicitanteOrganizacionNombre
                        })}
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleResponder(false)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <XCircle size={16} />
                        {t('common.reject', 'Rechazar')}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleResponder(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Check size={16} />
                        {t('common.accept', 'Aceptar')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
