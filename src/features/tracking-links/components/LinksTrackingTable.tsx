import { useTranslation } from 'react-i18next';
import { Copy, Trash2, Clock, ExternalLink, QrCode } from 'lucide-react';
import type { LinkTrackingDto } from '../types';

interface LinksTrackingTableProps {
  links: LinkTrackingDto[];
  onCopyUrl: (url: string) => void;
  onRevoke: (link: LinkTrackingDto) => void;
  onExtend: (link: LinkTrackingDto) => void;
  onShowQr: (link: LinkTrackingDto) => void;
}

function LinkEstado({ link }: { link: LinkTrackingDto }) {
  const { t } = useTranslation();

  if (!link.activo) {
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t('trackingLinks.estadoRevocado')}</span>;
  }
  if (link.estaExpirado) {
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{t('trackingLinks.estadoExpirado')}</span>;
  }
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('trackingLinks.estadoActivo')}</span>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function LinksTrackingTable({ links, onCopyUrl, onRevoke, onExtend, onShowQr }: LinksTrackingTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.vehiculoNombre')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.nombre')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.tipoAcceso')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.accesos')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.fechaCreacion')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.fechaExpiracion')}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">{t('trackingLinks.estado')}</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-text-muted">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const isActive = link.activo && !link.estaExpirado;
            return (
              <tr key={link.id} className="border-b border-border hover:bg-background/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{link.vehiculoNombre}</p>
                    <p className="text-xs text-text-muted">{link.vehiculoPatente}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text">{link.nombre || '—'}</td>
                <td className="px-4 py-3 text-sm text-text">
                  <TipoAccesoBadge tipoAcceso={link.tipoAcceso} />
                </td>
                <td className="px-4 py-3 text-sm text-text">
                  {link.accesosCount}{link.maxAccesos ? ` / ${link.maxAccesos}` : ''}
                </td>
                <td className="px-4 py-3 text-sm text-text">{formatDate(link.fechaCreacion)}</td>
                <td className="px-4 py-3 text-sm text-text">{formatDate(link.fechaExpiracion)}</td>
                <td className="px-4 py-3"><LinkEstado link={link} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {isActive && (
                      <>
                        <button
                          onClick={() => onCopyUrl(link.url)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t('trackingLinks.copiarUrl')}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => onShowQr(link)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t('trackingLinks.qr.verQr')}
                        >
                          <QrCode size={16} />
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t('trackingLinks.abrirPagina')}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          onClick={() => onExtend(link)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title={t('trackingLinks.extender')}
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => onRevoke(link)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title={t('trackingLinks.revocar')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {!isActive && <span className="text-sm text-text-muted">-</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TipoAccesoBadge({ tipoAcceso }: { tipoAcceso: number }) {
  const { t } = useTranslation();
  const labels: Record<number, string> = {
    1: t('trackingLinks.tipoAccesoSoloUbicacion'),
    2: t('trackingLinks.tipoAccesoUbicacionConRuta'),
    3: t('trackingLinks.tipoAccesoCompleto'),
  };
  return <span className="text-xs">{labels[tipoAcceso] || '—'}</span>;
}
