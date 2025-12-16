import { OrganizationTheme } from '@/shared/types/organization';

/**
 * Organizaciones demo para modo mock
 * Cada una tiene su propio theme para white-label
 */
export const demoOrganizations: OrganizationTheme[] = [
  {
    id: 'org-segurostech',
    name: 'SegurosTech',
    logo: '/logos/segurostech.svg',
    theme: {
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      secondary: '#0ea5e9',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      // Tokens semánticos para roles
      roleAdmin: '#a855f7',
      roleAdminBg: 'rgba(168, 85, 247, 0.1)',
      roleAdminText: '#c4b5fd',
      roleOperador: '#3b82f6',
      roleOperadorBg: 'rgba(59, 130, 246, 0.1)',
      roleOperadorText: '#93c5fd',
      roleAnalista: '#22c55e',
      roleAnalistaBg: 'rgba(34, 197, 94, 0.1)',
      roleAnalistaText: '#86efac',
      roleDefault: '#94a3b8',
      roleDefaultBg: 'rgba(148, 163, 184, 0.1)',
      roleDefaultText: '#cbd5e1',
    },
  },
  {
    id: 'org-autoprotect',
    name: 'AutoProtect',
    logo: '/logos/autoprotect.svg',
    theme: {
      primary: '#059669',
      primaryDark: '#047857',
      secondary: '#14b8a6',
      background: '#0c1017',
      surface: '#1a2332',
      text: '#f0fdf4',
      textMuted: '#86efac',
      border: '#2d4a3e',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      // Tokens semánticos para roles
      roleAdmin: '#a855f7',
      roleAdminBg: 'rgba(168, 85, 247, 0.1)',
      roleAdminText: '#c4b5fd',
      roleOperador: '#3b82f6',
      roleOperadorBg: 'rgba(59, 130, 246, 0.1)',
      roleOperadorText: '#93c5fd',
      roleAnalista: '#22c55e',
      roleAnalistaBg: 'rgba(34, 197, 94, 0.1)',
      roleAnalistaText: '#86efac',
      roleDefault: '#94a3b8',
      roleDefaultBg: 'rgba(148, 163, 184, 0.1)',
      roleDefaultText: '#cbd5e1',
    },
  },
  {
    id: 'org-driveshield',
    name: 'DriveShield',
    logo: '/logos/driveshield.svg',
    theme: {
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      secondary: '#a855f7',
      background: '#0f0a1a',
      surface: '#1e1533',
      text: '#f5f3ff',
      textMuted: '#c4b5fd',
      border: '#3b2d5c',
      success: '#34d399',
      warning: '#fcd34d',
      error: '#fb7185',
      // Tokens semánticos para roles
      roleAdmin: '#a855f7',
      roleAdminBg: 'rgba(168, 85, 247, 0.1)',
      roleAdminText: '#c4b5fd',
      roleOperador: '#3b82f6',
      roleOperadorBg: 'rgba(59, 130, 246, 0.1)',
      roleOperadorText: '#93c5fd',
      roleAnalista: '#22c55e',
      roleAnalistaBg: 'rgba(34, 197, 94, 0.1)',
      roleAnalistaText: '#86efac',
      roleDefault: '#94a3b8',
      roleDefaultBg: 'rgba(148, 163, 184, 0.1)',
      roleDefaultText: '#cbd5e1',
    },
  },
];

export function getOrganizationById(id: string): OrganizationTheme | undefined {
  return demoOrganizations.find(org => org.id === id);
}
