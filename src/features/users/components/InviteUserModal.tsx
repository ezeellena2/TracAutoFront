import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal, Input, Button } from '@/shared/ui';
import { invitacionesApi } from '@/services/endpoints';
import { toast } from '@/store';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RolOption = 'Admin' | 'Operador' | 'Analista';

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolOption>('Analista');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await invitacionesApi.createInvitacion(email, rol);
      toast.success(`Invitación enviada a ${email}`);
      setEmail('');
      setRol('Analista');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMsg = error.response?.data?.detail || 'Error al enviar invitación';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">Invitar Usuario</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Email del invitado
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Rol a asignar
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolOption)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Analista">Analista</option>
              <option value="Operador">Operador</option>
              <option value="Admin">Administrador</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              {rol === 'Admin' && 'Puede gestionar usuarios y configuración'}
              {rol === 'Operador' && 'Puede realizar operaciones del día a día'}
              {rol === 'Analista' && 'Solo lectura y reportes'}
            </p>
          </div>



          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !email}
              className="flex-1"
            >
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
