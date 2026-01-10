import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Cpu,
  Bell,
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
  Clock,
  X
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantStore, useSidebarStore } from '@/store';
import { usePermissions } from '@/hooks';
import { Permission } from '@/config/permissions';
import { TipoOrganizacion } from '@/shared/types/api';

interface NavItem {
  path?: string; // Opcional si tiene children
  labelKey: string; // Key de traducción en lugar de label hardcodeado
  icon: React.ElementType;
  /** Permiso requerido para ver este ítem. Si no se especifica, visible para todos */
  requiredPermission?: Permission;
  /** Tipo de organización requerido para ver este ítem */
  requiredOrganizationType?: TipoOrganizacion;
  /** Items hijos para submenús */
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/mapa', labelKey: 'sidebar.map', icon: Map },
  {
    path: '/marketplace',
    labelKey: 'marketplace.title',
    icon: ShoppingCart,
    requiredOrganizationType: TipoOrganizacion.ConcesionarioAutos
  },
  { path: '/vehiculos', labelKey: 'sidebar.vehicles', icon: Car },
  { path: '/dispositivos', labelKey: 'sidebar.devices', icon: Cpu },
  { path: '/eventos', labelKey: 'sidebar.events', icon: Bell },
  { path: '/conductores', labelKey: 'sidebar.drivers', icon: UserCircle, requiredPermission: 'conductores:ver' },
  { path: '/turnos-taxi', labelKey: 'sidebar.turnosTaxi', icon: Clock, requiredOrganizationType: TipoOrganizacion.FlotaPrivada },
  {
    labelKey: 'sidebar.organization',
    icon: Building,
    requiredPermission: 'organizacion:editar',
    children: [
      { path: '/usuarios', labelKey: 'sidebar.users', icon: Users, requiredPermission: 'usuarios:ver' },
      { path: '/configuracion/empresa/apariencia', labelKey: 'sidebar.organizationAppearance', icon: Palette },
      { path: '/configuracion/empresa/relaciones', labelKey: 'sidebar.organizationRelations', icon: Link2 },
    ]
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
  const { currentOrganization } = useTenantStore();
  const { can } = usePermissions();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Close mobile drawer when route changes
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  // Filtrar items según permisos del usuario y tipo de organización
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      // Validar permiso
      const hasPermission = !item.requiredPermission || can(item.requiredPermission);

      // Validar tipo de organización
      const hasOrganizationType = !item.requiredOrganizationType ||
        (currentOrganization?.tipoOrganizacion === item.requiredOrganizationType);

      return hasPermission && hasOrganizationType;
    });
  }, [can, currentOrganization]);

  // Auto-expandir submenús cuando la ruta actual coincide con algún hijo
  useEffect(() => {
    const newExpanded = new Set<string>();
    visibleNavItems.forEach((item, index) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child =>
          child.path && location.pathname === child.path
        );
        if (hasActiveChild) {
          newExpanded.add(`menu-${index}`);
        }
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
      {/* Mobile backdrop */}
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
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors md:hidden"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleNavItems.map((item, index) => {
            const menuKey = `menu-${index}`;

            // Si tiene children, renderizar como submenú
            if (item.children) {
              const isExpanded = isMenuExpanded(menuKey);
              const hasActiveChild = item.children.some(child =>
                child.path && location.pathname === child.path
              );

              return (
                <div key={menuKey} className="space-y-1">
                  <button
                    onClick={() => !isCollapsed && toggleMenu(menuKey)}
                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${hasActiveChild
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:text-text hover:bg-background'
                      }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                    disabled={isCollapsed}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{t(item.labelKey)}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>

                  {/* Submenú items */}
                  {!isCollapsed && isExpanded && (
                    <div className="ml-4 space-y-1 border-l-2 border-border pl-2">
                      {item.children.map((child) => {
                        const isActive = child.path === location.pathname;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path!}
                            className={`
                            flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                            ${isActive
                                ? 'bg-primary text-white'
                                : 'text-text-muted hover:text-text hover:bg-background'
                              }
                          `}
                          >
                            <child.icon size={18} />
                            <span className="font-medium text-sm">{t(child.labelKey)}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Si no tiene children, renderizar como item normal
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text hover:bg-background'
                  }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              >
                <item.icon size={20} />
                {!isCollapsed && <span className="font-medium">{t(item.labelKey)}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse button - hidden on mobile */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border items-center justify-center text-text-muted hover:text-text transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Organization info at bottom */}
        {currentOrganization && !isCollapsed && (
          <div className="p-4 border-t border-border bg-background flex-shrink-0">
            <p className="text-xs text-text-muted">{t('sidebar.organizationLabel')}</p>
            <p className="text-sm font-medium text-text truncate">
              {currentOrganization.name}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
