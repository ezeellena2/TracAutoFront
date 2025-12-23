import { useState, useEffect, useCallback } from 'react';
import { Trash2, UserPlus, Clock, UserCog } from 'lucide-react';
import { ActionMenu, Card, CardHeader, Table, Badge, Button, PermissionGate, ConfirmationModal, PaginationControls } from '@/shared/ui';
import { organizacionesApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams } from '@/hooks';
import { UsuarioOrganizacionDto, ListaPaginada } from '@/shared/types/api';
import { InviteUserModal } from '../components/InviteUserModal';
import { PendingInvitationsTable } from '../components/PendingInvitationsTable';

type RolType = 'Admin' | 'Operador' | 'Analista';

export function UsersPage() {
  // Datos paginados
  const [usersData, setUsersData] = useState<ListaPaginada<UsuarioOrganizacionDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de paginación reutilizable
  const { 
    setNumeroPagina, 
    setTamanoPagina, 
    params: paginationParams 
  } = usePaginationParams({ initialPageSize: 10 });
  
  // Modales y estado de UI
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [refreshInvites, setRefreshInvites] = useState(0);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { can } = usePermissions();

  // Permisos específicos para acciones de usuarios
  const canEdit = can('usuarios:editar');
  const canDelete = can('usuarios:eliminar');

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await organizacionesApi.getUsuariosOrganizacion(paginationParams);
      setUsersData(result);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams]);

  // Refetch cuando cambian los parámetros de paginación
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChangeRole = async (userId: string, nuevoRol: RolType) => {
    try {
      await organizacionesApi.cambiarRolUsuario(userId, nuevoRol);
      await loadUsers();
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  const confirmDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setActionMenuOpen(null);
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      await organizacionesApi.removerUsuario(userId);
      await loadUsers();
      setUserToDelete(null);
    } catch (err) {
      console.error('Error removing user:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extraer items para la tabla (vacío si no hay datos)
  const users = usersData?.items ?? [];

  const columns = [
    { 
      key: 'nombreCompleto', 
      header: 'Usuario',
      render: (u: UsuarioOrganizacionDto) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {u.nombreCompleto.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-text">
              {u.nombreCompleto}
              {u.esDuenio && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  Dueño
                </span>
              )}
            </p>
            <p className="text-sm text-text-muted">{u.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u: UsuarioOrganizacionDto) => {
        const colors: Record<string, 'info' | 'warning' | 'success'> = {
          Admin: 'info',
          Operador: 'warning',
          Analista: 'success',
        };
        return (
          <div className="flex gap-2">
            <Badge variant={colors[u.rol] || 'default'}>{u.rol}</Badge>
            {!u.activo && <Badge variant="error" size="sm">Inhabilitado</Badge>}
          </div>
        );
      }
    },
    {
      key: 'fechaAsignacion',
      header: 'Miembro desde',
      render: (u: UsuarioOrganizacionDto) => (
        <div className={`flex items-center gap-1 text-text-muted ${!u.activo ? 'opacity-50' : ''}`}>
          <Clock size={14} />
          {formatDate(u.fechaAsignacion)}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (u: UsuarioOrganizacionDto) => {
        // Solo Admin puede ver acciones, y no se puede modificar al dueño
        if (!canEdit && !canDelete) return null;
        if (u.esDuenio) return null;
        
        const isOpen = actionMenuOpen === u.usuarioId;

        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => setActionMenuOpen(isOpen ? null : u.usuarioId)}
            onClose={() => setActionMenuOpen(null)}
          >
            <div className="flex flex-col">
              <div className="px-3 py-2 text-xs font-medium text-text-muted border-b border-border">
                Cambiar rol
              </div>
              {(['Admin', 'Operador', 'Analista'] as RolType[]).map((rol) => (
                <button
                  key={rol}
                  onClick={() => {
                    setActionMenuOpen(null);
                    handleChangeRole(u.usuarioId, rol);
                  }}
                  disabled={u.rol === rol}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 ${
                    u.rol === rol ? 'text-text-muted' : 'text-text'
                  }`}
                >
                  <UserCog size={14} />
                  {rol} {u.rol === rol && '(actual)'}
                </button>
              ))}

              <div className="border-t border-border my-1" />
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={() => {
                  setActionMenuOpen(null);
                  confirmDeleteUser(u.usuarioId);
                }}
              >
                <Trash2 size={14} />
                Eliminar definitivamente
              </button>
            </div>
          </ActionMenu>
        );
      }
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadUsers} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Usuarios</h1>
          <p className="text-text-muted mt-1">Gestión de usuarios de la organización</p>
        </div>
        
        <PermissionGate permission="usuarios:invitar">
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus size={18} className="mr-2" />
            Invitar Usuario
          </Button>
        </PermissionGate>
      </div>

      {/* Users Table */}
      <Card padding="none" className="overflow-visible">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No hay usuarios en esta organización
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={users}
              keyExtractor={(u) => u.usuarioId}
              containerClassName="overflow-visible"
            />
            {/* Controles de paginación */}
            {usersData && (
              <PaginationControls
                paginaActual={usersData.paginaActual}
                totalPaginas={usersData.totalPaginas}
                tamanoPagina={usersData.tamanoPagina}
                totalRegistros={usersData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Pending Invitations */}
      <PendingInvitationsTable key={refreshInvites} />

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
                <td className="px-4 py-3 text-text">Gestionar Usuarios</td>
                <td className="px-4 py-3 text-center">✅</td>
                <td className="px-4 py-3 text-center">❌</td>
                <td className="px-4 py-3 text-center">❌</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          loadUsers();
          setRefreshInvites(prev => prev + 1);
        }}
      />

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) handleRemoveUser(userToDelete);
        }}
        title="Eliminar Usuario"
        description="¿Estás seguro de eliminar este usuario de la organización? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
