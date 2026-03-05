import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { CalendarCheck, CalendarX, History } from 'lucide-react';
import { Button, EstadoVacio } from '@/shared/ui';
import { EstadoReserva } from '@/features/alquileres/types/reserva';
import { useMisReservas } from '../hooks/useMisReservas';
import { TarjetaReservaCliente } from '../components/TarjetaReservaCliente';

type TabKey = 'activas' | 'pasadas' | 'canceladas';

const TABS: { key: TabKey; estados: number[] }[] = [
  { key: 'activas', estados: [EstadoReserva.Tentativa, EstadoReserva.Confirmada, EstadoReserva.EnCurso] },
  { key: 'pasadas', estados: [EstadoReserva.Completada, EstadoReserva.NoShow] },
  { key: 'canceladas', estados: [EstadoReserva.Cancelada] },
];

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  activas: <CalendarCheck size={14} />,
  pasadas: <History size={14} />,
  canceladas: <CalendarX size={14} />,
};

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-border rounded" />
        <div className="h-5 w-16 bg-border rounded-full" />
      </div>
      <div className="h-4 w-40 bg-border rounded mb-3" />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="h-12 bg-border rounded" />
        <div className="h-12 bg-border rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-3 w-28 bg-border rounded" />
        <div className="h-4 w-20 bg-border rounded" />
      </div>
    </div>
  );
}

export default function MisReservasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reservas, isLoading, error, refetch } = useMisReservas();
  const [tabActiva, setTabActiva] = useState<TabKey>('activas');

  const conteos = useMemo(() =>
    TABS.reduce((acc, tab) => {
      acc[tab.key] = reservas.filter(r => tab.estados.includes(r.estado)).length;
      return acc;
    }, {} as Record<TabKey, number>),
    [reservas],
  );

  const reservasFiltradas = useMemo(() => {
    const tab = TABS.find(tab => tab.key === tabActiva);
    if (!tab) return [];
    return reservas.filter(r => tab.estados.includes(r.estado));
  }, [reservas, tabActiva]);

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.misReservas.titulo')}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="container-app py-6">
      {/* Titulo */}
      <h1 className="text-2xl font-bold text-text mb-6">
        {t('alquilerPublico.misReservas.titulo')}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(({ key }) => (
          <button
            key={key}
            onClick={() => setTabActiva(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tabActiva === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {TAB_ICONS[key]}
            {t(`alquilerPublico.misReservas.tabs.${key}`)}
            {conteos[key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tabActiva === key ? 'bg-primary/10 text-primary' : 'bg-border text-text-muted'
              }`}>
                {conteos[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-error mb-4">{t('alquilerPublico.misReservas.error.cargar')}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('alquilerPublico.misReservas.error.reintentar')}
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Contenido */}
      {!isLoading && !error && (
        <>
          {reservasFiltradas.length === 0 ? (
            <EstadoVacio
              titulo={t(`alquilerPublico.misReservas.vacio.${tabActiva}`)}
              descripcion={t(`alquilerPublico.misReservas.vacio.${tabActiva}Hint`)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservasFiltradas.map(reserva => (
                <TarjetaReservaCliente
                  key={reserva.id}
                  reserva={reserva}
                  onClick={() => navigate(`/mis-reservas/${reserva.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
