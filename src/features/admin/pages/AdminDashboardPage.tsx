import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  Users,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRightLeft,
  Eye,
  Settings2,
  Wrench,
  History,
  TrendingUp,
  Download,
  Boxes,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Spinner,
  EstadoError,
  EstadoVacio,
  KPICard,
} from '@/shared/ui';
import { adminApi } from '@/services/endpoints/admin.api';
import type {
  AdminOrganizacionResumenDto,
  TransferenciaPendienteDto,
  PagoFallidoAdminDto,
  TrialPorVencerAdminDto,
  HistorialSuscripcionAdminDto,
  ModuloDefinicionAdminDto,
} from '@/services/endpoints/admin.api';
import { toast } from '@/store/toast.store';
import { downloadBlob } from '@/shared/utils/fileUtils';

type Tab = 'overview' | 'organizations' | 'transfers' | 'subscriptions' | 'modules' | 'troubleshooting' | 'analytics';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: t('admin.tabs.overview'), icon: BarChart3 },
    { key: 'organizations', label: t('admin.tabs.organizations'), icon: Building2 },
    { key: 'transfers', label: t('admin.tabs.transfers'), icon: ArrowRightLeft },
    { key: 'subscriptions', label: t('admin.tabs.subscriptions'), icon: Settings2 },
    { key: 'modules', label: t('admin.tabs.modules'), icon: Boxes },
    { key: 'troubleshooting', label: t('admin.tabs.troubleshooting'), icon: Wrench },
    { key: 'analytics', label: t('admin.tabs.analytics'), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('admin.title')}</h1>
        <p className="text-text-muted mt-1">{t('admin.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text hover:border-border'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'organizations' && <OrganizationsTab />}
      {activeTab === 'transfers' && <TransfersTab />}
      {activeTab === 'subscriptions' && <SubscriptionsTab />}
      {activeTab === 'modules' && <ModulesTab />}
      {activeTab === 'troubleshooting' && <TroubleshootingTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

// ─── Overview Tab ───

function OverviewTab() {
  const { t } = useTranslation();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getAdminStats,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <EstadoError mensaje={(error as Error).message} onReintentar={refetch} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(stats.transferenciasPendientes > 0 || stats.trialsPorVencer7Dias > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.transferenciasPendientes > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5">
              <AlertTriangle className="text-warning shrink-0" size={20} />
              <p className="text-sm text-text">
                <span className="font-semibold">{stats.transferenciasPendientes}</span>{' '}
                {t('admin.alerts.pendingTransfers')}
              </p>
            </div>
          )}
          {stats.trialsPorVencer7Dias > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5">
              <Clock className="text-warning shrink-0" size={20} />
              <p className="text-sm text-text">
                <span className="font-semibold">{stats.trialsPorVencer7Dias}</span>{' '}
                {t('admin.alerts.trialsExpiring')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Organizations KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          {t('admin.sections.organizations')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title={t('admin.totalOrganizations')} value={stats.organizacionesTotales} icon={Building2} color="primary" />
          <KPICard title={t('admin.activeOrganizations')} value={stats.organizacionesActivas} icon={Users} color="success" />
          <KPICard title={t('admin.stats.newThisMonth')} value={stats.organizacionesNuevasDelMes} icon={Building2} color="primary" />
        </div>
      </div>

      {/* Subscriptions KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          {t('admin.sections.subscriptions')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard title={t('admin.subscriptions.status.Activa')} value={stats.suscripcionesActivas} color="success" />
          <KPICard title={t('admin.subscriptions.status.Trial')} value={stats.suscripcionesTrial} color="primary" />
          <KPICard title={t('admin.subscriptions.status.PendienteVerificacionPago')} value={stats.suscripcionesPendienteVerificacion} color="warning" />
          <KPICard title={t('admin.subscriptions.status.Cancelada')} value={stats.suscripcionesCanceladas} color="error" />
          <KPICard title={t('admin.subscriptions.status.Expirada')} value={stats.suscripcionesExpiradas} color="error" />
        </div>
      </div>

      {/* Revenue & Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t('admin.sections.revenue')} />
          <div className="px-6 pb-6">
            <div className="flex items-baseline gap-2">
              <DollarSign className="text-success" size={20} />
              <span className="text-3xl font-bold text-text">${stats.ingresoMensualRecurrente.toLocaleString()}</span>
              <span className="text-sm text-text-muted">/mes (MRR)</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('admin.sections.gateways')} />
          <div className="px-6 pb-6 space-y-2">
            <GatewayBar label="Stripe" value={stats.gatewayStripe} total={stats.suscripcionesActivas + stats.suscripcionesTrial} color="bg-primary" />
            <GatewayBar label={t('admin.subscriptions.gateway.Transferencia')} value={stats.gatewayTransferencia} total={stats.suscripcionesActivas + stats.suscripcionesTrial} color="bg-warning" />
            <GatewayBar label="MercadoPago" value={stats.gatewayMercadoPago} total={stats.suscripcionesActivas + stats.suscripcionesTrial} color="bg-success" />
            <GatewayBar label={t('admin.subscriptions.gateway.Ninguno')} value={stats.gatewayNinguno} total={stats.suscripcionesActivas + stats.suscripcionesTrial} color="bg-text-muted" />
          </div>
        </Card>
      </div>

      {/* By Type */}
      <Card>
        <CardHeader title={t('admin.sections.byType')} />
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-text">{stats.suscripcionesNormales}</p>
              <p className="text-sm text-text-muted">{t('admin.subscriptions.type.Normal')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-text">{stats.suscripcionesDemo}</p>
              <p className="text-sm text-text-muted">{t('admin.subscriptions.type.Demo')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-2xl font-bold text-text">{stats.suscripcionesCortesia}</p>
              <p className="text-sm text-text-muted">{t('admin.subscriptions.type.Cortesia')}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function GatewayBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-muted w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-text w-12 text-right">{value}</span>
    </div>
  );
}

// ─── Organizations Tab ───

function OrganizationsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'organizaciones', page, search],
    queryFn: () =>
      adminApi.getAdminOrganizaciones({
        numeroPagina: page,
        tamanoPagina: 10,
        filtroNombre: search || undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const orgs = data?.items ?? [];
  const totalRegistros = data?.totalRegistros ?? 0;
  const totalPaginas = data?.totalPaginas ?? 1;

  function getStatusBadge(estado: string | null) {
    if (!estado) return <Badge variant="default" size="sm">-</Badge>;
    const variantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      Activa: 'success', Trial: 'info', PendienteVerificacionPago: 'warning',
      Cancelada: 'error', Expirada: 'error', PausadaPorFaltaDePago: 'warning',
    };
    return (
      <Badge variant={variantMap[estado] ?? 'default'} size="sm">
        {t(`admin.subscriptions.status.${estado}`, estado)}
      </Badge>
    );
  }

  function getGatewayBadge(gateway: string | null) {
    if (!gateway) return '-';
    return t(`admin.subscriptions.gateway.${gateway}`, gateway);
  }

  return (
    <Card>
      <CardHeader
        title={t('admin.organizationsTitle')}
        subtitle={t('admin.organizationsSubtitle')}
        action={
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <EstadoError mensaje={(error as Error).message} onReintentar={refetch} />
      ) : orgs.length === 0 ? (
        <EstadoVacio titulo={t('admin.emptyTitle')} descripcion={t('admin.emptyDescription')} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.columns.name')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.columns.cuit')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.columns.status')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.subscriptions.columns.status')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.subscriptions.columns.gateway')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.subscriptions.columns.amount')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.columns.modules')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.stats.users')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.columns.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orgs.map((org: AdminOrganizacionResumenDto) => (
                  <tr key={org.organizacionId} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3"><p className="font-medium text-text">{org.nombre}</p></td>
                    <td className="px-4 py-3 text-text-muted">{org.cuit ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={org.activa ? 'success' : 'error'} size="sm">
                        {org.activa ? t('admin.statusActive') : t('admin.statusInactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(org.estadoSuscripcion)}</td>
                    <td className="px-4 py-3 text-text-muted">{getGatewayBadge(org.gateway)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {org.montoMensual != null ? `$${org.montoMensual.toLocaleString()} ${org.moneda ?? ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{org.modulosActivos}</td>
                    <td className="px-4 py-3 text-text-muted">{org.cantidadUsuarios}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(org.fechaCreacion).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-muted">
                {t('admin.showing', { from: (page - 1) * 10 + 1, to: Math.min(page * 10, totalRegistros), total: totalRegistros })}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1 text-sm rounded border border-border text-text hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed">
                  {t('common.previous')}
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))} disabled={page >= totalPaginas}
                  className="px-3 py-1 text-sm rounded border border-border text-text hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed">
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Transfers Tab ───

function TransfersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: transfers, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'transferencias-pendientes'],
    queryFn: adminApi.getTransferenciasPendientes,
    staleTime: 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: (orgId: string) => adminApi.aprobarTransferencia(orgId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success(t('admin.transfers.approveSuccess')); },
    onError: (err: Error) => { toast.error(err.message || t('common.error')); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orgId, motivo }: { orgId: string; motivo: string }) => adminApi.rechazarTransferencia(orgId, motivo),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); setRejectingId(null); setRejectReason(''); toast.success(t('admin.transfers.rejectSuccess')); },
    onError: (err: Error) => { toast.error(err.message || t('common.error')); },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <EstadoError mensaje={(error as Error).message} onReintentar={refetch} />;
  if (!transfers || transfers.length === 0) return <EstadoVacio titulo={t('admin.transfers.emptyTitle')} descripcion={t('admin.transfers.emptyDescription')} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{t('admin.transfers.subtitle', { count: transfers.length })}</p>
      {transfers.map((tr: TransferenciaPendienteDto) => (
        <Card key={tr.suscripcionId}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-text-muted" />
                  <h3 className="font-semibold text-text">{tr.nombreOrganizacion}</h3>
                  <Badge variant="warning" size="sm">{t('admin.subscriptions.status.PendienteVerificacionPago')}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted">{t('admin.transfers.amount')}</p>
                    <p className="font-medium text-text">${tr.montoMensual.toLocaleString()} {tr.moneda}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">{t('admin.transfers.modules')}</p>
                    <p className="font-medium text-text">{tr.cantidadModulos}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">{t('admin.transfers.requestDate')}</p>
                    <p className="font-medium text-text">{new Date(tr.fechaSolicitud).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">{t('admin.transfers.receipt')}</p>
                    {tr.comprobanteUrl ? (
                      <a href={tr.comprobanteUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                        <Eye size={14} /> {t('admin.transfers.viewReceipt')}
                      </a>
                    ) : <p className="text-text-muted">-</p>}
                  </div>
                </div>
              </div>
            </div>
            {rejectingId === tr.organizacionId && (
              <div className="mt-4 p-4 rounded-lg bg-background border border-border space-y-3">
                <p className="text-sm font-medium text-text">{t('admin.transfers.rejectReason')}</p>
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('admin.transfers.rejectReasonPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <div className="flex gap-2">
                  <button onClick={() => rejectMutation.mutate({ orgId: tr.organizacionId, motivo: rejectReason })}
                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:bg-error/90 disabled:opacity-50">
                    {rejectMutation.isPending ? t('common.loading') : t('admin.transfers.confirmReject')}
                  </button>
                  <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                    className="px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-background">{t('common.cancel')}</button>
                </div>
              </div>
            )}
            {rejectingId !== tr.organizacionId && (
              <div className="mt-4 flex gap-3">
                <button onClick={() => approveMutation.mutate(tr.organizacionId)} disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-success text-white hover:bg-success/90 disabled:opacity-50">
                  <CheckCircle size={16} /> {approveMutation.isPending ? t('common.loading') : t('admin.transfers.approve')}
                </button>
                <button onClick={() => setRejectingId(tr.organizacionId)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-error text-error hover:bg-error/5">
                  <XCircle size={16} /> {t('admin.transfers.reject')}
                </button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Subscriptions Tab (Admin Tools) ───

function SubscriptionsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ── Crear Demo ──
  const [demoOrgId, setDemoOrgId] = useState('');
  const [demoTipo, setDemoTipo] = useState(2); // Demo=2
  const [demoMotivo, setDemoMotivo] = useState('');
  const [demoDias, setDemoDias] = useState('');
  const [demoMoneda, setDemoMoneda] = useState('ARS');

  const demoMutation = useMutation({
    mutationFn: () => adminApi.crearSuscripcionDemo({
      organizacionId: demoOrgId,
      tipoSuscripcion: demoTipo,
      motivoExencion: demoMotivo,
      diasDuracion: demoDias ? parseInt(demoDias) : undefined,
      moneda: demoMoneda,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success(t('admin.subscriptions.demoForm.success'));
      setDemoOrgId(''); setDemoMotivo(''); setDemoDias('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Extender Trial ──
  const [trialOrgId, setTrialOrgId] = useState('');
  const [trialDias, setTrialDias] = useState('');
  const [trialMotivo, setTrialMotivo] = useState('');

  const trialMutation = useMutation({
    mutationFn: () => adminApi.extenderTrial(trialOrgId, {
      diasExtension: parseInt(trialDias),
      motivo: trialMotivo,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success(t('admin.subscriptions.extendForm.success'));
      setTrialOrgId(''); setTrialDias(''); setTrialMotivo('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Forzar Estado ──
  const [forceOrgId, setForceOrgId] = useState('');
  const [forceEstado, setForceEstado] = useState(2); // Activa=2
  const [forceMotivo, setForceMotivo] = useState('');

  const forceMutation = useMutation({
    mutationFn: () => adminApi.forzarEstadoSuscripcion(forceOrgId, {
      nuevoEstado: forceEstado,
      motivo: forceMotivo,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success(t('admin.subscriptions.forceForm.success'));
      setForceOrgId(''); setForceMotivo('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30';
  const selectClass = 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Crear Demo/Cortesía */}
      <Card>
        <CardHeader title={t('admin.subscriptions.demoForm.title')} />
        <div className="px-6 pb-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.orgId')}</label>
            <input type="text" value={demoOrgId} onChange={(e) => setDemoOrgId(e.target.value)}
              placeholder="UUID" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.type')}</label>
            <select value={demoTipo} onChange={(e) => setDemoTipo(Number(e.target.value))} className={selectClass}>
              <option value={2}>{t('admin.subscriptions.demoForm.typeDemo')}</option>
              <option value={3}>{t('admin.subscriptions.demoForm.typeCortesia')}</option>
              <option value={4}>{t('admin.subscriptions.demoForm.typeInternal')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.reason')}</label>
            <input type="text" value={demoMotivo} onChange={(e) => setDemoMotivo(e.target.value)}
              placeholder={t('admin.subscriptions.demoForm.reasonPlaceholder')} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.duration')}</label>
            <input type="number" value={demoDias} onChange={(e) => setDemoDias(e.target.value)}
              placeholder={t('admin.subscriptions.demoForm.durationPlaceholder')} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.currency')}</label>
            <select value={demoMoneda} onChange={(e) => setDemoMoneda(e.target.value)} className={selectClass}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <Button variant="primary" onClick={() => demoMutation.mutate()} isLoading={demoMutation.isPending}
            disabled={!demoOrgId || !demoMotivo} className="w-full">
            {t('admin.subscriptions.demoForm.submit')}
          </Button>
        </div>
      </Card>

      {/* Extender Trial */}
      <Card>
        <CardHeader title={t('admin.subscriptions.extendForm.title')} />
        <div className="px-6 pb-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.orgId')}</label>
            <input type="text" value={trialOrgId} onChange={(e) => setTrialOrgId(e.target.value)}
              placeholder="UUID" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.extendForm.days')}</label>
            <input type="number" value={trialDias} onChange={(e) => setTrialDias(e.target.value)}
              placeholder="7" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.extendForm.reason')}</label>
            <input type="text" value={trialMotivo} onChange={(e) => setTrialMotivo(e.target.value)}
              placeholder={t('admin.subscriptions.extendForm.reasonPlaceholder')} className={inputClass} />
          </div>
          <Button variant="primary" onClick={() => trialMutation.mutate()} isLoading={trialMutation.isPending}
            disabled={!trialOrgId || !trialDias || !trialMotivo} className="w-full">
            {t('admin.subscriptions.extendForm.submit')}
          </Button>
        </div>
      </Card>

      {/* Forzar Estado */}
      <Card>
        <CardHeader title={t('admin.subscriptions.forceForm.title')} />
        <div className="px-6 pb-6 space-y-3">
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning">{t('admin.subscriptions.forceForm.warning')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.demoForm.orgId')}</label>
            <input type="text" value={forceOrgId} onChange={(e) => setForceOrgId(e.target.value)}
              placeholder="UUID" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.forceForm.newStatus')}</label>
            <select value={forceEstado} onChange={(e) => setForceEstado(Number(e.target.value))} className={selectClass}>
              <option value={2}>{t('admin.subscriptions.status.Activa')}</option>
              <option value={4}>{t('admin.subscriptions.status.Cancelada')}</option>
              <option value={5}>{t('admin.subscriptions.status.Expirada')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">{t('admin.subscriptions.forceForm.reason')}</label>
            <input type="text" value={forceMotivo} onChange={(e) => setForceMotivo(e.target.value)}
              placeholder={t('admin.subscriptions.forceForm.reasonPlaceholder')} className={inputClass} />
          </div>
          <Button variant="danger" onClick={() => forceMutation.mutate()} isLoading={forceMutation.isPending}
            disabled={!forceOrgId || !forceMotivo} className="w-full">
            {t('admin.subscriptions.forceForm.submit')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Troubleshooting Tab ───

const GATEWAY_LABELS: Record<number, string> = {
  0: 'Ninguno', 1: 'Stripe', 2: 'MercadoPago', 3: 'Transferencia',
};

const EVENTO_LABELS: Record<number, string> = {
  1: 'Creada', 2: 'TrialIniciado', 3: 'Activada', 4: 'ModuloAgregado',
  5: 'ModuloRemovido', 6: 'PlanCambiado', 7: 'PagoProcesado', 8: 'PagoFallido',
  9: 'PausadaPorPago', 10: 'Reactivada', 11: 'Cancelada', 12: 'Expirada',
  13: 'EstadoCambiado', 14: 'TrialExtendido', 15: 'EstadoForzado',
  16: 'DemoCreada', 17: 'ModuloDemoAsignado', 18: 'ExencionOtorgada',
  19: 'TransferenciaPendiente', 20: 'TransferenciaAprobada', 21: 'TransferenciaRechazada',
};

function TroubleshootingTab() {
  const { t } = useTranslation();
  const [historialOrgId, setHistorialOrgId] = useState('');
  const [historialBuscado, setHistorialBuscado] = useState('');

  const { data: pagosFallidos, isLoading: loadingPagos, error: errorPagos, refetch: refetchPagos } = useQuery({
    queryKey: ['admin', 'pagos-fallidos'],
    queryFn: adminApi.getPagosFallidos,
    staleTime: 2 * 60 * 1000,
  });

  const { data: trialsPorVencer, isLoading: loadingTrials, error: errorTrials, refetch: refetchTrials } = useQuery({
    queryKey: ['admin', 'trials-por-vencer'],
    queryFn: adminApi.getTrialsPorVencer,
    staleTime: 2 * 60 * 1000,
  });

  const { data: historial, isLoading: loadingHistorial, error: errorHistorial, refetch: refetchHistorial } = useQuery({
    queryKey: ['admin', 'historial', historialBuscado],
    queryFn: () => adminApi.getHistorialSuscripcion(historialBuscado),
    enabled: !!historialBuscado,
  });

  return (
    <div className="space-y-6">
      {/* Pagos Fallidos */}
      <Card>
        <CardHeader
          title={t('admin.troubleshooting.failedPayments.title')}
          subtitle={t('admin.troubleshooting.failedPayments.subtitle')}
        />
        {loadingPagos ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : errorPagos ? (
          <EstadoError mensaje={(errorPagos as Error).message} onReintentar={refetchPagos} />
        ) : !pagosFallidos?.length ? (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle size={16} />
              {t('admin.troubleshooting.failedPayments.empty')}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.organization')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.gateway')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.amount')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.description')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagosFallidos.map((pf: PagoFallidoAdminDto, i) => (
                  <tr key={`${pf.suscripcionId}-${i}`} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-medium text-text">{pf.nombreOrganizacion}</td>
                    <td className="px-4 py-3 text-text-muted">{GATEWAY_LABELS[pf.gateway] ?? pf.gateway}</td>
                    <td className="px-4 py-3 text-text-muted">${pf.montoMensual.toLocaleString()} {pf.moneda}</td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate">{pf.descripcion ?? '-'}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(pf.fechaEvento).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trials por Vencer */}
      <Card>
        <CardHeader
          title={t('admin.troubleshooting.expiringTrials.title')}
          subtitle={t('admin.troubleshooting.expiringTrials.subtitle')}
        />
        {loadingTrials ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : errorTrials ? (
          <EstadoError mensaje={(errorTrials as Error).message} onReintentar={refetchTrials} />
        ) : !trialsPorVencer?.length ? (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle size={16} />
              {t('admin.troubleshooting.expiringTrials.empty')}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.organization')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.gateway')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.modules')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.users')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.expiresOn')}</th>
                  <th className="px-4 py-3 font-medium text-text-muted">{t('admin.troubleshooting.columns.daysLeft')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trialsPorVencer.map((tr: TrialPorVencerAdminDto) => (
                  <tr key={tr.suscripcionId} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-medium text-text">{tr.nombreOrganizacion}</td>
                    <td className="px-4 py-3 text-text-muted">{GATEWAY_LABELS[tr.gateway] ?? tr.gateway}</td>
                    <td className="px-4 py-3 text-text-muted">{tr.cantidadModulos}</td>
                    <td className="px-4 py-3 text-text-muted">{tr.cantidadUsuarios}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(tr.fechaFinTrial).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={tr.diasRestantes <= 2 ? 'error' : 'warning'} size="sm">
                        {tr.diasRestantes}d
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Historial de Suscripción */}
      <Card>
        <CardHeader
          title={t('admin.troubleshooting.history.title')}
          subtitle={t('admin.troubleshooting.history.subtitle')}
          action={
            <div className="flex gap-2">
              <input
                type="text"
                value={historialOrgId}
                onChange={(e) => setHistorialOrgId(e.target.value)}
                placeholder={t('admin.troubleshooting.history.placeholder')}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 w-72"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setHistorialBuscado(historialOrgId); refetchHistorial(); }}
                disabled={!historialOrgId.trim()}
              >
                <History size={14} className="mr-1" />
                {t('admin.troubleshooting.history.search')}
              </Button>
            </div>
          }
        />
        {loadingHistorial ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : errorHistorial ? (
          <EstadoError mensaje={(errorHistorial as Error).message} onReintentar={refetchHistorial} />
        ) : historialBuscado && (!historial || historial.length === 0) ? (
          <div className="px-6 pb-6">
            <EstadoVacio
              titulo={t('admin.troubleshooting.history.empty')}
              descripcion={t('admin.troubleshooting.history.emptyDescription')}
            />
          </div>
        ) : historial && historial.length > 0 ? (
          <div className="px-6 pb-6">
            <div className="relative border-l-2 border-border ml-4 space-y-4">
              {historial.map((ev: HistorialSuscripcionAdminDto) => {
                const eventoLabel = EVENTO_LABELS[ev.tipoEvento] ?? `Evento ${ev.tipoEvento}`;
                const isError = ev.tipoEvento === 8 || ev.tipoEvento === 9 || ev.tipoEvento === 11 || ev.tipoEvento === 12 || ev.tipoEvento === 21;
                const isSuccess = ev.tipoEvento === 3 || ev.tipoEvento === 7 || ev.tipoEvento === 10 || ev.tipoEvento === 20;

                return (
                  <div key={ev.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-surface ${
                      isError ? 'bg-error' : isSuccess ? 'bg-success' : 'bg-border'
                    }`} />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isError ? 'error' : isSuccess ? 'success' : 'default'} size="sm">
                            {eventoLabel}
                          </Badge>
                          {ev.nombreUsuario && (
                            <span className="text-xs text-text-muted">{ev.nombreUsuario}</span>
                          )}
                        </div>
                        {ev.descripcion && (
                          <p className="mt-1 text-sm text-text-muted">{ev.descripcion}</p>
                        )}
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(ev.fechaEvento).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

// ─── Analytics Tab ───

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--color-text)',
};

function AnalyticsTab() {
  const { t } = useTranslation();

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.getAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  const csvData = useMemo(() => {
    if (!analytics) return '';
    const lines: string[] = [];

    lines.push('--- MRR Mensual ---');
    lines.push('Mes,MRR');
    analytics.mrrMensual.forEach(m => lines.push(`${m.mes},${m.mrr}`));

    lines.push('');
    lines.push('--- Nuevas Organizaciones por Mes ---');
    lines.push('Mes,Cantidad');
    analytics.nuevasOrgsPorMes.forEach(m => lines.push(`${m.mes},${m.cantidad}`));

    lines.push('');
    lines.push('--- Suscripciones por Estado ---');
    lines.push('Estado,Cantidad');
    analytics.suscripcionesPorEstado.forEach(m => lines.push(`${m.estado},${m.cantidad}`));

    lines.push('');
    lines.push('--- Ingreso por Gateway ---');
    lines.push('Gateway,Monto');
    analytics.ingresoPorGateway.forEach(m => lines.push(`${m.gateway},${m.monto}`));

    lines.push('');
    lines.push('--- Churn Mensual ---');
    lines.push('Mes,Tasa (%)');
    analytics.churnMensual.forEach(m => lines.push(`${m.mes},${m.tasa}`));

    return lines.join('\n');
  }, [analytics]);

  function handleExportCsv() {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t('admin.analytics.exportSuccess'));
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <EstadoError mensaje={(error as Error).message} onReintentar={refetch} />;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">{t('admin.analytics.title')}</h2>
          <p className="text-sm text-text-muted">{t('admin.analytics.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download size={14} className="mr-1.5" />
          {t('admin.analytics.export')}
        </Button>
      </div>

      {/* MRR Area Chart */}
      <Card>
        <CardHeader title={t('admin.analytics.mrr.title')} subtitle={t('admin.analytics.mrr.subtitle')} />
        <div className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.mrrMensual} role="img" aria-label={t('admin.analytics.mrr.title')}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number | string | undefined) => [`$${Number(value ?? 0).toLocaleString()}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="var(--color-success)" fill="url(#mrrGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Orgs Bar Chart */}
        <Card>
          <CardHeader title={t('admin.analytics.newOrgs.title')} subtitle={t('admin.analytics.newOrgs.subtitle')} />
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.nuevasOrgsPorMes} role="img" aria-label={t('admin.analytics.newOrgs.title')}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number | string | undefined) => [Number(value ?? 0), t('admin.analytics.newOrgs.label')]} />
                <Bar dataKey="cantidad" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscriptions by Status Pie Chart */}
        <Card>
          <CardHeader title={t('admin.analytics.byStatus.title')} subtitle={t('admin.analytics.byStatus.subtitle')} />
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart role="img" aria-label={t('admin.analytics.byStatus.title')}>
                <Pie
                  data={analytics.suscripcionesPorEstado}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.suscripcionesPorEstado.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by Gateway Bar Chart */}
        <Card>
          <CardHeader title={t('admin.analytics.byGateway.title')} subtitle={t('admin.analytics.byGateway.subtitle')} />
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.ingresoPorGateway} role="img" aria-label={t('admin.analytics.byGateway.title')}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="gateway" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number | string | undefined) => [`$${Number(value ?? 0).toLocaleString()}`, t('admin.analytics.byGateway.label')]} />
                <Bar dataKey="monto" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Churn Line Chart */}
        <Card>
          <CardHeader title={t('admin.analytics.churn.title')} subtitle={t('admin.analytics.churn.subtitle')} />
          <div className="px-6 pb-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.churnMensual} role="img" aria-label={t('admin.analytics.churn.title')}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number | string | undefined) => [`${Number(value ?? 0)}%`, t('admin.analytics.churn.label')]} />
                <Line type="monotone" dataKey="tasa" stroke="var(--color-error)" strokeWidth={2} dot={{ fill: 'var(--color-error)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Modules Tab ───

function ModulesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: modulos, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'modulos-definicion'],
    queryFn: adminApi.getModulosDefinicion,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ codigo, data }: { codigo: number; data: { esGratis?: boolean; visible?: boolean; activo?: boolean } }) =>
      adminApi.actualizarModuloDefinicion(codigo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modulos-definicion'] });
      toast.success(t('admin.modules.updateSuccess'));
    },
    onError: () => {
      toast.error(t('admin.modules.updateError'));
    },
  });

  function handleToggle(modulo: ModuloDefinicionAdminDto, field: 'esGratis' | 'visible' | 'activo') {
    if (modulo.esBase && field === 'activo') return;
    mutation.mutate({ codigo: modulo.codigo, data: { [field]: !modulo[field] } });
  }

  function handleSetAllFree(free: boolean) {
    if (!modulos) return;
    const targets = modulos.filter(m => !m.esBase && m.esGratis !== free);
    targets.forEach(m => {
      mutation.mutate({ codigo: m.codigo, data: { esGratis: free } });
    });
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <EstadoError mensaje={(error as Error).message} onReintentar={refetch} />;
  if (!modulos?.length) return <EstadoVacio titulo={t('admin.modules.empty')} />;

  const freeCount = modulos.filter(m => m.esGratis).length;
  const visibleCount = modulos.filter(m => m.visible).length;

  return (
    <div className="space-y-6">
      {/* Summary + bulk actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-4">
          <Badge variant="info">{modulos.length} {t('admin.modules.total')}</Badge>
          <Badge variant="success">{freeCount} {t('admin.modules.free')}</Badge>
          <Badge variant="default">{visibleCount} {t('admin.modules.visibleCount')}</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSetAllFree(true)}
            disabled={mutation.isPending}
          >
            {t('admin.modules.setAllFree')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSetAllFree(false)}
            disabled={mutation.isPending}
          >
            {t('admin.modules.setAllPaid')}
          </Button>
        </div>
      </div>

      {/* Modules table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-text-muted">{t('admin.modules.column.module')}</th>
                <th className="px-4 py-3 font-medium text-text-muted text-center">{t('admin.modules.column.free')}</th>
                <th className="px-4 py-3 font-medium text-text-muted text-center">{t('admin.modules.column.visible')}</th>
                <th className="px-4 py-3 font-medium text-text-muted text-center">{t('admin.modules.column.active')}</th>
                <th className="px-4 py-3 font-medium text-text-muted">{t('admin.modules.column.requires')}</th>
              </tr>
            </thead>
            <tbody>
              {modulos.map(modulo => (
                <tr key={modulo.id} className="border-b border-border/50 hover:bg-background/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {modulo.codigo}
                      </div>
                      <div>
                        <p className="font-medium text-text">{modulo.nombre}</p>
                        <p className="text-xs text-text-muted">{modulo.descripcion}</p>
                      </div>
                      {modulo.esBase && (
                        <Badge variant="info" className="ml-1">{t('admin.modules.base')}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleSwitch
                      checked={modulo.esGratis}
                      onChange={() => handleToggle(modulo, 'esGratis')}
                      disabled={modulo.esBase || mutation.isPending}
                      colorOn="bg-success"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleSwitch
                      checked={modulo.visible}
                      onChange={() => handleToggle(modulo, 'visible')}
                      disabled={modulo.esBase || mutation.isPending}
                      colorOn="bg-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ToggleSwitch
                      checked={modulo.activo}
                      onChange={() => handleToggle(modulo, 'activo')}
                      disabled={modulo.esBase || mutation.isPending}
                      colorOn="bg-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {modulo.requiereModulos
                      ? modulo.requiereModulos.split(',').map(c => {
                          const dep = modulos.find(m => m.codigo === Number(c.trim()));
                          return dep?.nombre ?? c;
                        }).join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled, colorOn = 'bg-primary' }: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  colorOn?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? colorOn : 'bg-border'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
