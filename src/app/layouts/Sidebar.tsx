import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Cpu,
  Users,
  Building,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Map,
  UserCircle,
  Link2,
  ShoppingCart,
  MapPin,
  X,
  FileSpreadsheet,
  FileText,
  Globe,
  CreditCard,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantStore, useSidebarStore } from '@/store';
import { usePermissions } from '@/hooks';
import { Permission } from '@/config/permissions';
import { ModuloSistema } from '@/shared/types/api';
import type { UserRole } from '@/shared/types';

interface NavItem {
  path?: string;
  labelKey: string;
  icon: React.ElementType;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  requiredModule?: ModuloSistema | ModuloSistema[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/mapa', labelKey: 'sidebar.map', icon: Map },
  { path: '/marketplace', labelKey: 'marketplace.title', icon: ShoppingCart, requiredModule: ModuloSistema.Marketplace },
  { path: '/vehiculos', labelKey: 'sidebar.vehicles', icon: Car },
  { path: '/dispositivos', labelKey: 'sidebar.devices', icon: Cpu },
  { path: '/conductores', labelKey: 'sidebar.drivers', icon: UserCircle, requiredPermission: 'conductores:ver' },
  { path: '/geozonas', labelKey: 'sidebar.geofences', icon: MapPin },
  { path: '/importaciones', labelKey: 'sidebar.imports', icon: FileSpreadsheet },
  { path: '/suscripcion', labelKey: 'sidebar.subscription', icon: CreditCard, requiredPermission: 'suscripciones:ver' },
  {
    labelKey: 'sidebar.organization',
    icon: Building,
    requiredPermission: 'organizacion:editar',
    children: [
      { path: '/usuarios', labelKey: 'sidebar.users', icon: Users, requiredPermission: 'usuarios:ver' },
      { path: '/configuracion/empresa/apariencia', labelKey: 'sidebar.organizationAppearance', icon: Palette },
      { path: '/configuracion/empresa/preferencias', labelKey: 'sidebar.organizationPreferences', icon: Globe },
      { path: '/configuracion/empresa/relaciones', labelKey: 'sidebar.organizationRelations', icon: Link2 },
      { path: '/configuracion/empresa/solicitudes-cambio', labelKey: 'sidebar.organizationChangeRequests', icon: FileText },
    ]
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
  const { currentOrganization } = useTenantStore();
  const { can, role } = usePermissions();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMenuMouseEnter = (menuKey: string) => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMenu(menuKey);
  };

  const handleMenuMouseLeave = () => {
    if (!isCollapsed) return;
    hoverTimeoutRef.current = setTimeout(() => setHoveredMenu(null), 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  const visibleNavItems = useMemo(() => {
    const modulosActivos = currentOrganization?.modulosActivos ?? [];

    return navItems
      .filter(item => {
        if (item.requiredRole && role !== item.requiredRole) return false;

        const hasPermission = !item.requiredPermission || can(item.requiredPermission);
        const hasModule = !item.requiredModule ||
          (Array.isArray(item.requiredModule)
            ? item.requiredModule.some(m => modulosActivos.includes(m))
            : modulosActivos.includes(item.requiredModule));

        return hasPermission && hasModule;
      })
      .map(item => ({
        ...item,
        children: item.children?.filter(child => !child.requiredPermission || can(child.requiredPermission)),
      }));
  }, [can, role, currentOrganization]);

  useEffect(() => {
    const newExpanded = new Set<string>();
    visibleNavItems.forEach((item, index) => {
      if (item.children?.some(child => child.path && location.pathname === child.path)) {
        newExpanded.add(`menu-${index}`);
      }
    });
    setExpandedMenus(newExpanded);
  }, [location.pathname, visibleNavItems]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuKey)) {
        next.delete(menuKey);
      } else {
        next.add(menuKey);
      }
      return next;
    });
  };

  const isMenuExpanded = (menuKey: string) => expandedMenus.has(menuKey);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen bg-surface border-r border-border
          transition-all duration-300 z-50 flex flex-col
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64 -translate-x-full md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : ''}
        `}
      >
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors md:hidden"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        <div className="h-16 flex items-center justify-center border-b border-border px-4 flex-shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
              <span className="font-bold text-lg text-text">TracAuto</span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleNavItems.map((item, index) => {
            const menuKey = `menu-${index}`;

            if (item.children) {
              const isExpanded = isMenuExpanded(menuKey);
              const hasActiveChild = item.children.some(child => child.path && location.pathname === child.path);

              return (
                <div
                  key={menuKey}
                  className="relative space-y-1"
                  onMouseEnter={() => handleMenuMouseEnter(menuKey)}
                  onMouseLeave={handleMenuMouseLeave}
                >
                  <button
                    onClick={() => !isCollapsed && toggleMenu(menuKey)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${hasActiveChild ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-background'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{t(item.labelKey)}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {isCollapsed && hoveredMenu === menuKey && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-56 bg-surface border border-border rounded-lg shadow-lg py-2">
                      <p className="px-4 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {t(item.labelKey)}
                      </p>
                      {item.children.map(child => {
                        const isActive = child.path === location.pathname;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path!}
                            className={`
                              flex items-center gap-3 px-4 py-2 transition-all duration-200
                              ${isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-background'}
                            `}
                          >
                            <child.icon size={18} />
                            <span>{t(child.labelKey)}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}

                  {!isCollapsed && isExpanded && (
                    <div className="ml-4 space-y-1 border-l border-border pl-3">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path!}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                            ${isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-background'}
                          `}
                        >
                          <child.icon size={18} />
                          <span className="font-medium">{t(child.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-background'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon size={20} />
                {!isCollapsed && <span className="font-medium">{t(item.labelKey)}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between">
          {!isCollapsed && <span className="text-xs text-text-muted truncate">TracAuto</span>}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
            aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
