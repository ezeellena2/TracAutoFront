import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Building2, Shield, Moon, Sun } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { authService } from '@/services/auth.service';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const handleToggleDarkMode = () => {
    // Cambia el modo UI (baseTheme) y re-aplica el mismo override de organización (sin modificarlo).
    setDarkMode(!isDarkMode, currentOrganization?.theme);
  };

  // Mapeo de roles a clases basadas en tokens del sistema
  const roleColors: Record<string, string> = {
    Admin: 'bg-role-admin-bg text-role-admin-text',
    Operador: 'bg-role-operador-bg text-role-operador-text',
    Analista: 'bg-role-analista-bg text-role-analista-text',
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      {/* Organization info */}
      <div className="flex items-center gap-4">
        {currentOrganization && (
          <div className="flex items-center gap-3">
            {currentOrganization.logo ? (
              <div className="w-8 h-8 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center">
                <img
                  src={currentOrganization.logo}
                  alt={`${currentOrganization.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-primary"
              >
                {currentOrganization.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-semibold text-text">{currentOrganization.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-background transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text">{user?.nombre || 'Usuario'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user?.rol || ''] || 'bg-role-default-bg text-role-default-text'}`}>
              {user?.rol || 'Usuario'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <ChevronDown size={16} className={`text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl border border-border shadow-xl py-2 z-50">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{user?.nombre}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Organization info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-text-muted">
                <Building2 size={14} />
                <span className="text-xs">{currentOrganization?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted mt-1">
                <Shield size={14} />
                <span className="text-xs">{user?.rol}</span>
              </div>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={handleToggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-background transition-colors"
            >
              {isDarkMode ? (
                <>
                  <Sun size={16} />
                  Modo claro
                </>
              ) : (
                <>
                  <Moon size={16} />
                  Modo oscuro
                </>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
