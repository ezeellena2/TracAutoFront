import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';

import { UsersPage } from '../UsersPage';

const mocks = vi.hoisted(() => ({
  getUsuariosOrganizacion: vi.fn(),
}));

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');
  return {
    ...actual,
    usePermissions: () => ({ can: () => true }),
    usePaginationParams: () => ({
      setNumeroPagina: vi.fn(),
      setTamanoPagina: vi.fn(),
      params: { numeroPagina: 1, tamanoPagina: 10 },
    }),
    useLocalization: () => ({
      culture: 'es-AR',
      timeZoneId: 'America/Argentina/Buenos_Aires',
    }),
    useErrorHandler: () => ({
      handleApiError: () => ({ message: 'error' }),
    }),
    useImportJobPolling: () => ({
      job: null,
      isPolling: false,
      error: null,
      stopPolling: vi.fn(),
    }),
  };
});

vi.mock('@/services/endpoints', () => ({
  organizacionesApi: {
    getUsuariosOrganizacion: mocks.getUsuariosOrganizacion,
    cambiarRolUsuario: vi.fn(),
    removerUsuario: vi.fn(),
  },
  invitacionesApi: {
    createInvitacion: vi.fn(),
    cancelInvitacion: vi.fn(),
    getInvitacionesPendientes: vi.fn(),
    reenviarInvitacion: vi.fn(),
    exportInvitacionesExcel: vi.fn(),
    importInvitacionesExcel: vi.fn(),
    downloadTemplateInvitacionesExcel: vi.fn(),
  },
}));

vi.mock('@/shared/ui', async () => {
  const actual = await vi.importActual<typeof import('@/shared/ui')>('@/shared/ui');
  return {
    ...actual,
    PermissionGate: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

vi.mock('../components/InviteUserModal', () => ({
  InviteUserModal: () => null,
}));

vi.mock('../components/PendingInvitationsTable', () => ({
  PendingInvitationsTable: () => <div data-testid="pending-invitations" />,
}));

vi.mock('@/shared/ui/ConfirmationModal', () => ({
  ConfirmationModal: () => null,
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUsuariosOrganizacion.mockResolvedValue({
      items: [],
      paginaActual: 1,
      tamanoPagina: 10,
      totalPaginas: 1,
      totalRegistros: 0,
    });
  });

  it('muestra acciones para exportar e importar invitaciones', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(mocks.getUsuariosOrganizacion).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: /(Export invitations|Exportar invitaciones)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /(Import invitations|Importar invitaciones)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /(Invite User|Invitar Usuario)/i })).toBeInTheDocument();
  });
});
