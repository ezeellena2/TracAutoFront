import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, userEvent } from '@/test/test-utils';
import { TrackingLinksPage } from '../TrackingLinksPage';
import { TipoAccesoTracking, type LinkTrackingDto } from '../../types';

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
}));

vi.mock('../../api', () => ({
  trackingLinksApi: {
    listar: mocks.listar,
    crear: vi.fn(),
    revocar: vi.fn(),
    extender: vi.fn(),
  },
  trackingPublicoApi: {
    obtenerPosicion: vi.fn(),
  },
}));

const activeLink: LinkTrackingDto = {
  id: 'active-link',
  token: 'token-active',
  url: '/t/token-active',
  nombre: 'Link activo',
  vehiculoPatente: 'AA123BB',
  vehiculoNombre: 'Toyota Hilux',
  fechaCreacion: '2026-03-17T10:00:00Z',
  fechaExpiracion: '2026-03-17T18:00:00Z',
  tipoAcceso: TipoAccesoTracking.Completo,
  accesosCount: 3,
  maxAccesos: 10,
  activo: true,
  estaExpirado: false,
};

const expiredLink: LinkTrackingDto = {
  id: 'expired-link',
  token: 'token-expired',
  url: '/t/token-expired',
  nombre: 'Link expirado',
  vehiculoPatente: 'CC456DD',
  vehiculoNombre: 'Ford Ranger',
  fechaCreacion: '2026-03-16T09:00:00Z',
  fechaExpiracion: '2026-03-16T11:00:00Z',
  tipoAcceso: TipoAccesoTracking.SoloUbicacion,
  accesosCount: 5,
  maxAccesos: null,
  activo: true,
  estaExpirado: true,
};

const revokedLink: LinkTrackingDto = {
  id: 'revoked-link',
  token: 'token-revoked',
  url: '/t/token-revoked',
  nombre: 'Link revocado',
  vehiculoPatente: 'EE789FF',
  vehiculoNombre: 'Chevrolet S10',
  fechaCreacion: '2026-03-15T08:00:00Z',
  fechaExpiracion: '2026-03-18T08:00:00Z',
  tipoAcceso: TipoAccesoTracking.UbicacionConRuta,
  accesosCount: 1,
  maxAccesos: 2,
  activo: false,
  estaExpirado: false,
};

describe('TrackingLinksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listar.mockResolvedValue([activeLink, expiredLink, revokedLink]);
  });

  it('carga todos los links y muestra solo activos por defecto', async () => {
    render(<TrackingLinksPage />);

    await waitFor(() => {
      expect(mocks.listar).toHaveBeenCalledWith({ soloActivos: false });
    });

    expect(await screen.findByRole('tab', { name: /Activos|Active/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Histórico|History/i })).toBeInTheDocument();
    expect(screen.getByText('Link activo')).toBeInTheDocument();
    expect(screen.queryByText('Link expirado')).not.toBeInTheDocument();
    expect(screen.queryByText('Link revocado')).not.toBeInTheDocument();
    expect(screen.getByText(/Creado|Created/i)).toBeInTheDocument();
  });

  it('permite cambiar a historico y ver links expirados o revocados', async () => {
    const user = userEvent.setup();
    render(<TrackingLinksPage />);

    const historicalTab = await screen.findByRole('tab', { name: /Histórico|History/i });
    await user.click(historicalTab);

    expect(historicalTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Link expirado')).toBeInTheDocument();
    expect(screen.getByText('Link revocado')).toBeInTheDocument();
    expect(screen.queryByText('Link activo')).not.toBeInTheDocument();
  });
});
