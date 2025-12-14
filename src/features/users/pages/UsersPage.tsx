import { useState } from 'react';
import { UserPlus, Clock } from 'lucide-react';
import { Card, CardHeader, Table, Badge, Button, Modal, Input, PermissionTooltip } from '@/shared/ui';
import { mockOrganizationUsers } from '@/services/mock';
import { useAuthStore } from '@/store';
import { UserRole } from '@/shared/types';

interface OrganizationUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  ultimoAcceso: string | null;
}

export function UsersPage() {
  const [users, setUsers] = useState(mockOrganizationUsers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuthStore();

  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    rol: 'Analista' as UserRole,
  });

  const isAdmin = currentUser?.rol === 'Admin';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const created = {
      id: `user-${Date.now()}`,
      ...newUser,
      estado: 'activo',
      ultimoAcceso: new Date().toISOString(),
    };
    
    setUsers(prev => [...prev, created]);
    setIsLoading(false);
    setIsCreateModalOpen(false);
    setNewUser({ nombre: '', email: '', rol: 'Analista' });
  };

  const columns = [
    { 
      key: 'nombre', 
      header: 'Usuario',
      render: (u: OrganizationUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {u.nombre.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-text">{u.nombre}</p>
            <p className="text-sm text-text-muted">{u.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u: OrganizationUser) => {
        const colors: Record<string, 'info' | 'warning' | 'success'> = {
          Admin: 'info',
          Operador: 'warning',
          Analista: 'success',
        };
        return <Badge variant={colors[u.rol] || 'default'}>{u.rol}</Badge>;
      }
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u: OrganizationUser) => (
        <Badge variant={u.estado === 'activo' ? 'success' : 'warning'}>
          {u.estado}
        </Badge>
      )
    },
    {
      key: 'ultimoAcceso',
      header: 'Último Acceso',
      render: (u: OrganizationUser) => (
        <div className="flex items-center gap-1 text-text-muted">
          <Clock size={14} />
          {formatDate(u.ultimoAcceso)}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Usuarios</h1>
          <p className="text-text-muted mt-1">Gestión de usuarios de la organización</p>
        </div>
        
        <PermissionTooltip hasPermission={isAdmin} permissionName="Administrador">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!isAdmin}
          >
            <UserPlus size={18} className="mr-2" />
            Nuevo Usuario
          </Button>
        </PermissionTooltip>
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader 
          title="Matriz de Permisos" 
          subtitle="Permisos por rol en el sistema"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-text-muted">Permiso</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Admin</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Operador</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">Analista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-text">Ver Dashboard</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text">Ver Vehículos</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text">Gestionar Dispositivos</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">❌</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text">Resolver Eventos</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">❌</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text">Crear Usuarios</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">❌</td>
                <td className="px-4 py-3 text-center">❌</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Usuario"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nombre completo"
            value={newUser.nombre}
            onChange={(e) => setNewUser(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder="Juan Pérez"
            required
          />
          
          <Input
            label="Correo electrónico"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            placeholder="juan@empresa.com"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Rol</label>
            <select
              value={newUser.rol}
              onChange={(e) => setNewUser(prev => ({ ...prev, rol: e.target.value as UserRole }))}
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Admin">Administrador</option>
              <option value="Operador">Operador</option>
              <option value="Analista">Analista</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
