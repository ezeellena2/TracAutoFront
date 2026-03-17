import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invitacionesApi } from '../invitaciones.api';
import { apiClient } from '../../http/apiClient';
import { useAuthStore } from '@/store';

vi.mock('../../http/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/store', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

describe('invitacionesApi excel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore.getState).mockReturnValue({ organizationId: 'org-123' } as ReturnType<typeof useAuthStore.getState>);
  });

  it('descarga el template de invitaciones', async () => {
    const blob = new Blob(['template']);
    vi.mocked(apiClient.get).mockResolvedValue({ data: blob } as never);

    const result = await invitacionesApi.downloadTemplateInvitacionesExcel();

    expect(apiClient.get).toHaveBeenCalledWith(
      'organizaciones/org-123/invitaciones/excel/template',
      { responseType: 'blob' }
    );
    expect(result).toBe(blob);
  });

  it('exporta las invitaciones pendientes', async () => {
    const blob = new Blob(['export']);
    vi.mocked(apiClient.get).mockResolvedValue({ data: blob } as never);

    const result = await invitacionesApi.exportInvitacionesExcel();

    expect(apiClient.get).toHaveBeenCalledWith(
      'organizaciones/org-123/invitaciones/excel',
      { responseType: 'blob' }
    );
    expect(result).toBe(blob);
  });

  it('importa invitaciones desde excel', async () => {
    const file = new File(['contenido'], 'invitaciones.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const response = {
      totalFilas: 1,
      filasExitosas: 1,
      filasConErrores: 0,
      errores: [],
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: response } as never);

    const result = await invitacionesApi.importInvitacionesExcel(file);

    expect(apiClient.post).toHaveBeenCalledWith(
      'organizaciones/org-123/invitaciones/excel/importar',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      }
    );
    expect(result).toEqual(response);
  });
});
