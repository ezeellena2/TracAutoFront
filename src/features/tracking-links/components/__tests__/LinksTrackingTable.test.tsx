import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { LinksTrackingTable } from '../LinksTrackingTable';
import { TipoAccesoTracking, type LinkTrackingDto } from '../../types';

const activeLink: LinkTrackingDto = {
  id: 'link-1',
  token: 'token-1',
  url: 'https://tracking.example.com/link-1',
  nombre: 'Entrega cliente',
  vehiculoPatente: 'AA123BB',
  vehiculoNombre: 'Toyota Hilux',
  fechaCreacion: '2026-03-17T12:00:00Z',
  fechaExpiracion: '2026-03-17T18:00:00Z',
  tipoAcceso: TipoAccesoTracking.Completo,
  accesosCount: 2,
  maxAccesos: 5,
  activo: true,
  estaExpirado: false,
};

describe('LinksTrackingTable', () => {
  it('muestra un tooltip para abrir la pagina de tracking', () => {
    render(
      <LinksTrackingTable
        links={[activeLink]}
        onCopyUrl={vi.fn()}
        onRevoke={vi.fn()}
        onExtend={vi.fn()}
        onShowQr={vi.fn()}
      />,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'title',
      expect.stringMatching(/Abrir página de tracking|Open tracking page/i),
    );
  });
});
