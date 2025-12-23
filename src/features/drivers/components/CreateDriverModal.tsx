import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal, Input, Button } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import type { CreateConductorCommand } from '../types';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDriverModal({ isOpen, onClose, onSuccess }: CreateDriverModalProps) {
  const [form, setForm] = useState<CreateConductorCommand>({
    nombreCompleto: '',
    dni: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<{ nombreCompleto?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: { nombreCompleto?: string } = {};
    if (!form.nombreCompleto.trim()) {
      validationErrors.nombreCompleto = 'El nombre completo es requerido';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await conductoresApi.crear({
        nombreCompleto: form.nombreCompleto.trim(),
        dni: form.dni?.trim() || undefined,
        email: form.email?.trim() || undefined,
        telefono: form.telefono?.trim() || undefined,
      });
      toast.success('Conductor creado correctamente');
      setForm({ nombreCompleto: '', dni: '', email: '', telefono: '' });
      setErrors({});
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMsg = error.response?.data?.detail || 'No se pudo crear el conductor';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ nombreCompleto: '', dni: '', email: '', telefono: '' });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">Agregar Conductor</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={form.nombreCompleto}
            onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
            placeholder="Juan Pérez"
            error={errors.nombreCompleto}
            required
          />
          <Input
            label="DNI"
            value={form.dni || ''}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            placeholder="12345678"
          />
          <Input
            label="Email"
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="juan@example.com"
          />
          <Input
            label="Teléfono"
            value={form.telefono || ''}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+54 11 1234-5678"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

