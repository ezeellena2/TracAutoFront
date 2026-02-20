import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Building2, Shield, Moon, Sun, FileEdit } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useTenantStore, useThemeStore, useModoSolicitudStore } from '@/store';
import { authService } from '@/services/auth.service';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { NotificationBell, NotificationDrawer, useNotifications } from '@/features/notifications';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const { activo, toggle } = useModoSolicitudStore();
  const {
    recent,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    archivar,
  } = useNotifications();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when opening
  const handleToggleDropdown = () => {
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownMenuRef.current?.contains(target)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    }

    // Use a small delay to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 relative z-[9999]">
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

      {/* Modo Solicitud toggle + User menu */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          data-tracauto-modo-solicitud-toggle
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activo ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-background'}`}
          title={t('header.modoSolicitud')}
          aria-pressed={activo}
        >
          <FileEdit size={18} />
          <span className="hidden sm:inline">{t('header.modoSolicitud')}</span>
        </button>
        <NotificationBell
          unreadCount={unreadCount}
          connectionState={connectionState}
          onClick={() => setIsNotificationsOpen(true)}
        />
        <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={handleToggleDropdown}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-background transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text">{user?.nombre || t('users.roles.usuario')}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user?.rol || ''] || 'bg-role-default-bg text-role-default-text'}`}>
              {user?.rol || t('users.roles.usuario')}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <ChevronDown size={16} className={`text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div 
            ref={dropdownMenuRef}
            className="fixed w-64 max-w-[calc(100vw-2rem)] bg-surface rounded-xl border border-border shadow-xl py-2 z-[10000]"
            style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
          >
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

            {/* Language switcher */}
            <div className="px-4 py-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t('header.language')}</span>
                <LanguageSwitcher />
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
                  {t('header.lightMode')}
                </>
              ) : (
                <>
                  <Moon size={16} />
                  {t('header.darkMode')}
                </>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors"
            >
              <LogOut size={16} />
              {t('header.logout')}
            </button>
          </div>
        )}
        </div>
      </div>
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={recent}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onArchivar={archivar}
      />
    </header>
  );
}
