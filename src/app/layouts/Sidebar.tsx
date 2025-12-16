import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Cpu, 
  Bell, 
  Users,
  Palette,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTenantStore } from '@/store';
import { usePermissions } from '@/hooks';
import { Permission } from '@/config/permissions';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  /** Permiso requerido para ver este ítem. Si no se especifica, visible para todos */
  requiredPermission?: Permission;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vehiculos', label: 'Vehículos', icon: Car },
  { path: '/dispositivos', label: 'Dispositivos', icon: Cpu },
  { path: '/eventos', label: 'Eventos', icon: Bell },
  { path: '/usuarios', label: 'Usuarios', icon: Users, requiredPermission: 'usuarios:ver' },
  { path: '/configuracion/empresa/apariencia', label: 'Empresa · Apariencia', icon: Palette, requiredPermission: 'organizacion:editar' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentOrganization } = useTenantStore();
  const { can } = usePermissions();

  // Filtrar items según permisos del usuario
  const visibleNavItems = useMemo(() => 
    navItems.filter(item => 
      !item.requiredPermission || can(item.requiredPermission)
    ),
    [can]
  );

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-full bg-surface border-r border-border
        transition-all duration-300 z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
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
      <nav className="p-4 space-y-2">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Organization info at bottom */}
      {currentOrganization && !isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-background rounded-lg">
          <p className="text-xs text-text-muted">Organización</p>
          <p className="text-sm font-medium text-text truncate">
            {currentOrganization.name}
          </p>
        </div>
      )}
    </aside>
  );
}
