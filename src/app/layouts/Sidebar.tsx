import { NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useTenantStore, useSidebarStore } from '@/store';
import { usePermissions } from '@/hooks';
import { resolveNavigation, type NavigationRegistryItem } from '@/app/navigation/navigationRegistry';

export function Sidebar() {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
  const { currentOrganization } = useTenantStore();
  const { user } = useAuthStore();
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

  const visibleNavItems = useMemo(
    () => resolveNavigation({ user, currentOrganization, can, role }),
    [can, currentOrganization, role, user],
  );

  useEffect(() => {
    const newExpanded = new Set<string>();
    visibleNavItems.forEach((item, index) => {
      if (item.children?.some((child) => child.path && location.pathname === child.path)) {
        newExpanded.add(`menu-${index}`);
      }
    });
    setExpandedMenus(newExpanded);
  }, [location.pathname, visibleNavItems]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => {
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

  const renderLeaf = (item: NavigationRegistryItem) => (
    <NavLink
      key={item.key}
      to={item.path!}
      data-testid={`sidebar-link-${item.key}`}
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
        data-testid="app-sidebar"
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

        <div className="h-14 flex items-center justify-center border-b border-border px-4 flex-shrink-0">
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

            if (!item.children?.length) {
              return renderLeaf(item);
            }

            const isExpanded = isMenuExpanded(menuKey);
            const hasActiveChild = item.children.some((child) => child.path && location.pathname === child.path);

            return (
              <div
                key={menuKey}
                className="relative space-y-1"
                onMouseEnter={() => handleMenuMouseEnter(menuKey)}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  onClick={() => !isCollapsed && toggleMenu(menuKey)}
                  data-testid={`sidebar-group-${item.key}`}
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
                    {item.children.map((child) => {
                      const isActive = child.path === location.pathname;
                      return (
                        <NavLink
                          key={child.key}
                          to={child.path!}
                          data-testid={`sidebar-link-${child.key}`}
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
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path!}
                        data-testid={`sidebar-link-${child.key}`}
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
          })}
        </nav>

        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border items-center justify-center text-text-muted hover:text-text transition-colors"
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {!isCollapsed && (currentOrganization || user?.contextoActivo) && (
          <div className="p-4 border-t border-border bg-background flex-shrink-0">
            <p className="text-xs text-text-muted">
              {currentOrganization ? t('sidebar.organizationLabel') : 'Contexto'}
            </p>
            <p className="text-sm font-medium text-text truncate">
              {currentOrganization?.name || user?.contextoActivo?.nombre || 'Personal'}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
