import type { ElementType } from 'react';
import {
  Building,
  Car,
  Cpu,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutDashboard,
  Link2,
  Map,
  MapPin,
  Navigation2,
  Palette,
  ShoppingCart,
  UserCircle,
  Users,
} from 'lucide-react';
import type { Permission } from '@/config/permissions';
import { ModuloSistema } from '@/shared/types/api';
import type { AuthUser, UserRole } from '@/shared/types';
import type { OrganizationTheme } from '@/shared/types/organization';

export interface NavigationRegistryItem {
  key: string;
  labelKey: string;
  descriptionKey: string;
  icon: ElementType;
  path?: string;
  contexts: Array<'Personal' | 'Organizacion'>;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  requiredModule?: ModuloSistema | ModuloSistema[];
  requiredCapability?: string | string[];
  showInDashboard?: boolean;
  children?: NavigationRegistryItem[];
}

export interface ResolveNavigationOptions {
  user: AuthUser | null;
  currentOrganization: OrganizationTheme | null;
  can: (permission: Permission) => boolean;
  role: UserRole | null;
}

export const navigationRegistry: NavigationRegistryItem[] = [
  {
    key: 'dashboard',
    path: '/',
    labelKey: 'sidebar.dashboard',
    descriptionKey: 'navigation.dashboard.description',
    icon: LayoutDashboard,
    contexts: ['Personal', 'Organizacion'],
    showInDashboard: false,
  },
  {
    key: 'seguimiento',
    labelKey: 'sidebar.trackingHub',
    descriptionKey: 'navigation.trackingHub.description',
    icon: Navigation2,
    contexts: ['Personal', 'Organizacion'],
    children: [
      {
        key: 'mapa',
        path: '/mapa',
        labelKey: 'sidebar.map',
        descriptionKey: 'navigation.map.description',
        icon: Map,
        contexts: ['Personal', 'Organizacion'],
        requiredModule: ModuloSistema.Flota,
        showInDashboard: true,
      },
      {
        key: 'vehiculos',
        path: '/vehiculos',
        labelKey: 'sidebar.vehicles',
        descriptionKey: 'navigation.vehicles.description',
        icon: Car,
        contexts: ['Personal', 'Organizacion'],
        requiredModule: ModuloSistema.Flota,
        showInDashboard: true,
      },
      {
        key: 'dispositivos',
        path: '/dispositivos',
        labelKey: 'sidebar.devices',
        descriptionKey: 'navigation.devices.description',
        icon: Cpu,
        contexts: ['Personal', 'Organizacion'],
        requiredModule: ModuloSistema.Flota,
        showInDashboard: true,
      },
      {
        key: 'conductores',
        path: '/conductores',
        labelKey: 'sidebar.drivers',
        descriptionKey: 'navigation.drivers.description',
        icon: UserCircle,
        contexts: ['Personal', 'Organizacion'],
        requiredModule: ModuloSistema.Flota,
        requiredPermission: 'conductores:ver',
        showInDashboard: false,
      },
      {
        key: 'geozonas',
        path: '/geozonas',
        labelKey: 'sidebar.geofences',
        descriptionKey: 'navigation.geofences.description',
        icon: MapPin,
        contexts: ['Personal', 'Organizacion'],
        requiredModule: ModuloSistema.Flota,
        showInDashboard: true,
      },
      {
        key: 'importaciones',
        path: '/importaciones',
        labelKey: 'sidebar.imports',
        descriptionKey: 'navigation.imports.description',
        icon: FileSpreadsheet,
        contexts: ['Organizacion'],
        showInDashboard: false,
      },
    ],
  },
  {
    key: 'marketplace',
    path: '/marketplace',
    labelKey: 'marketplace.title',
    descriptionKey: 'navigation.marketplace.description',
    icon: ShoppingCart,
    contexts: ['Organizacion'],
    requiredModule: ModuloSistema.Marketplace,
    showInDashboard: true,
  },
  {
    key: 'suscripcion',
    path: '/suscripcion',
    labelKey: 'sidebar.subscription',
    descriptionKey: 'navigation.subscription.description',
    icon: CreditCard,
    contexts: ['Personal', 'Organizacion'],
    requiredPermission: 'suscripciones:ver',
    showInDashboard: true,
  },
  {
    key: 'organizacion',
    labelKey: 'sidebar.organization',
    descriptionKey: 'navigation.organization.description',
    icon: Building,
    contexts: ['Organizacion'],
    requiredPermission: 'organizacion:editar',
    children: [
      {
        key: 'usuarios',
        path: '/usuarios',
        labelKey: 'sidebar.users',
        descriptionKey: 'navigation.users.description',
        icon: Users,
        contexts: ['Organizacion'],
        requiredPermission: 'usuarios:ver',
      },
      {
        key: 'organizacion-apariencia',
        path: '/configuracion/empresa/apariencia',
        labelKey: 'sidebar.organizationAppearance',
        descriptionKey: 'navigation.organizationAppearance.description',
        icon: Palette,
        contexts: ['Organizacion'],
      },
      {
        key: 'organizacion-preferencias',
        path: '/configuracion/empresa/preferencias',
        labelKey: 'sidebar.organizationPreferences',
        descriptionKey: 'navigation.organizationPreferences.description',
        icon: Globe,
        contexts: ['Organizacion'],
      },
      {
        key: 'organizacion-relaciones',
        path: '/configuracion/empresa/relaciones',
        labelKey: 'sidebar.organizationRelations',
        descriptionKey: 'navigation.organizationRelations.description',
        icon: Link2,
        contexts: ['Organizacion'],
      },
      {
        key: 'organizacion-solicitudes-cambio',
        path: '/configuracion/empresa/solicitudes-cambio',
        labelKey: 'sidebar.organizationChangeRequests',
        descriptionKey: 'navigation.organizationChangeRequests.description',
        icon: FileText,
        contexts: ['Organizacion'],
        showInDashboard: true,
      },
    ],
  },
];

function includesRequiredCapability(
  activeCapabilities: string[],
  requiredCapability?: string | string[],
): boolean {
  if (!requiredCapability) {
    return true;
  }

  const capabilities = Array.isArray(requiredCapability) ? requiredCapability : [requiredCapability];
  return capabilities.some((capability) => activeCapabilities.includes(capability));
}

function includesRequiredModule(
  activeModules: number[],
  requiredModule?: ModuloSistema | ModuloSistema[],
): boolean {
  if (!requiredModule) {
    return true;
  }

  const modules = Array.isArray(requiredModule) ? requiredModule : [requiredModule];
  return modules.some((moduleCode) => activeModules.includes(moduleCode));
}

function resolveItem(
  item: NavigationRegistryItem,
  contextType: 'Personal' | 'Organizacion',
  activeModules: number[],
  activeCapabilities: string[],
  can: (permission: Permission) => boolean,
  role: UserRole | null,
): NavigationRegistryItem | null {
  if (!item.contexts.includes(contextType)) {
    return null;
  }

  if (item.requiredRole && role !== item.requiredRole) {
    return null;
  }

  if (item.requiredPermission && !can(item.requiredPermission)) {
    return null;
  }

  if (!includesRequiredModule(activeModules, item.requiredModule)) {
    return null;
  }

  if (!includesRequiredCapability(activeCapabilities, item.requiredCapability)) {
    return null;
  }

  if (!item.children || item.children.length === 0) {
    return item;
  }

  const children = item.children
    .map((child) => resolveItem(child, contextType, activeModules, activeCapabilities, can, role))
    .filter((child): child is NavigationRegistryItem => child !== null);

  if (children.length === 0) {
    return null;
  }

  return {
    ...item,
    children,
  };
}

export function resolveNavigation(options: ResolveNavigationOptions): NavigationRegistryItem[] {
  const { user, currentOrganization, can, role } = options;
  const contextType = user?.contextoActivo?.tipo === 'Organizacion' ? 'Organizacion' : 'Personal';
  const activeModules = user?.contextoActivo?.modulosActivos ?? currentOrganization?.modulosActivos ?? [];
  const activeCapabilities = user?.contextoActivo?.capacidadesEfectivas ?? [];

  return navigationRegistry
    .map((item) => resolveItem(item, contextType, activeModules, activeCapabilities, can, role))
    .filter((item): item is NavigationRegistryItem => item !== null);
}

export function resolveDashboardNavigation(options: ResolveNavigationOptions): NavigationRegistryItem[] {
  const resolved = resolveNavigation(options);
  const flat: NavigationRegistryItem[] = [];

  const visit = (items: NavigationRegistryItem[]) => {
    for (const item of items) {
      if (item.path && item.showInDashboard) {
        flat.push(item);
      }
      if (item.children?.length) {
        visit(item.children);
      }
    }
  };

  visit(resolved);

  return flat;
}
