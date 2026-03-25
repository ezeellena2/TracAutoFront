import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Building2, Shield, Moon, Sun, FileEdit, Check, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useTenantStore, useThemeStore, useModoSolicitudStore } from '@/store';
import { authService } from '@/services/auth.service';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { IndicadoresHeader } from '@/shared/ui/IndicadoresHeader';
import { FeriadosHeader } from '@/shared/ui/FeriadosHeader';

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode } = useThemeStore();
  const { activo, toggle } = useModoSolicitudStore();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [switchingContextId, setSwitchingContextId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const contextLabel = currentOrganization?.name || user?.contextoActivo?.nombre || 'Personal';
  const availableContexts = user?.contextosDisponibles ?? [];
  const contextTypeLabel = isPersonalContext ? 'Personal' : 'Organización';

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
    setDarkMode(!isDarkMode, currentOrganization?.theme);
  };

  const handleChangeContext = async (contextId: string) => {
    const target = availableContexts.find((contexto) =>
      `${contexto.tipo}:${contexto.id ?? 'personal'}` === contextId
    );

    if (!target || !user) return;

    const currentId = `${user.contextoActivo.tipo}:${user.contextoActivo.id ?? 'personal'}`;
    if (contextId === currentId) {
      setIsDropdownOpen(false);
      return;
    }

    setSwitchingContextId(contextId);
    const result = await authService.cambiarContexto(target);
    setSwitchingContextId(null);

    if (!result.success) {
      return;
    }

    setIsDropdownOpen(false);
    navigate('/', { replace: true });
  };

  const roleColors: Record<string, string> = {
    SuperAdmin: 'bg-error/10 text-error',
    Admin: 'bg-role-admin-bg text-role-admin-text',
    Operador: 'bg-role-operador-bg text-role-operador-text',
    Analista: 'bg-role-analista-bg text-role-analista-text',
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 relative z-[9999]">
      {}
      <div className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
        {(currentOrganization || isPersonalContext) && (
          <div className="flex items-center gap-2.5 cursor-default">
            {currentOrganization?.logo ? (
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                {contextLabel.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-sm text-text truncate max-w-[140px]">
              {contextLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">

        {}
        <div className="relative" ref={dropdownRef}>
          <button
            ref={buttonRef}
            onClick={handleToggleDropdown}
            data-testid="user-menu-trigger"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background transition-colors duration-200 cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-text leading-tight">{user?.nombre || t('users.roles.usuario')}</p>
              {isPersonalContext ? (
                <span className="text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                  Personal
                </span>
              ) : (
                <span className={`text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium ${roleColors[user?.rol || ''] || 'bg-role-default-bg text-role-default-text'}`}>
                  {user?.rol || t('users.roles.usuario')}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <User size={15} className="text-white" />
            </div>
            <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {}
          {isDropdownOpen && (
            <div
              ref={dropdownMenuRef}
              data-testid="user-menu-dropdown"
              className="fixed w-72 max-w-[calc(100vw-2rem)] bg-surface rounded-xl border border-border shadow-2xl shadow-black/8 dark:shadow-black/30 py-1.5 z-[10000]"
              style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
            >
              {}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{user?.nombre}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2.5 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={12} className="flex-shrink-0" />
                      <span className="truncate">{contextLabel || 'Mi cuenta'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Shield size={12} className="flex-shrink-0" />
                      <span>{isPersonalContext ? 'Personal' : (user?.rol || t('users.roles.usuario'))}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {isPersonalContext
                      ? t('header.context.personalDescription', { defaultValue: 'Todo lo que ves ahora corresponde a tu espacio personal y a modulos habilitados para tu cuenta.' })
                      : t('header.context.organizationDescription', { defaultValue: 'Las rutas y acciones visibles se recalculan segun la organizacion activa y tu rol operativo.' })}
                  </p>
                </div>

              {availableContexts.length > 1 ? (
                <div className="px-4 py-3 border-b border-border space-y-2">
                  <div data-testid="context-switcher-list" className="space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Contextos operativos
                  </p>
                  <p className="text-xs text-text-muted">
                    {t('header.context.switchDescription', { defaultValue: 'Cambia entre tu cuenta personal y las organizaciones donde tienes acceso real, sin cerrar sesion.' })}
                  </p>
                  <div className="space-y-1">
                    {availableContexts.map((context) => {
                      const contextId = `${context.tipo}:${context.id ?? 'personal'}`;
                      const isActive =
                        user?.contextoActivo?.tipo === context.tipo &&
                        (user?.contextoActivo?.id ?? null) === (context.id ?? null);
                      const isLoading = switchingContextId === contextId;

                      return (
                        <button
                          key={contextId}
                          type="button"
                          onClick={() => void handleChangeContext(contextId)}
                          disabled={isLoading}
                          data-testid={`context-option-${contextId}`}
                          className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-background'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block font-medium truncate">{context.nombre}</span>
                            <span className="block text-xs text-text-muted">
                              {context.tipo === 'Personal' ? 'Personal' : (context.rol ?? 'Organización')}
                            </span>
                          </span>
                          {isLoading ? (
                            <Loader2 size={14} className="animate-spin flex-shrink-0" />
                          ) : isActive ? (
                            <Check size={14} className="flex-shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 border-b border-border space-y-1">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Contexto operativo
                  </p>
                  <p className="text-sm text-text">{contextLabel}</p>
                  <p className="text-xs text-text-muted">
                    Esta sesión hoy tiene disponible solo el contexto {contextTypeLabel.toLowerCase()}.
                  </p>
                </div>
              )}

              {}
              <div className="px-4 py-3 border-b border-border space-y-2">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{t('header.indicadores', 'Indicadores')}</p>
                <div className="flex flex-col gap-1.5">
                  <FeriadosHeader />
                  <IndicadoresHeader />
                </div>
              </div>

              {}
              <button
                type="button"
                onClick={toggle}
                data-tracauto-modo-solicitud-toggle
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                  activo ? 'text-primary' : 'text-text hover:bg-background'
                }`}
                aria-pressed={activo}
              >
                <span className="flex items-center gap-2.5">
                  <FileEdit size={15} />
                  <span>{t('header.modoSolicitud')}</span>
                </span>
                {}
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    activo ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      activo ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>

              <div className="border-t border-border" />

              {}
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{t('header.language')}</span>
                  <LanguageSwitcher />
                </div>
              </div>

              {}
              <button
                onClick={handleToggleDarkMode}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors duration-150 cursor-pointer"
              >
                {isDarkMode ? (
                  <>
                    <Sun size={15} className="text-amber-500" />
                    <span>{t('header.lightMode')}</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-indigo-400" />
                    <span>{t('header.darkMode')}</span>
                  </>
                )}
              </button>

              {}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors duration-150 cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>{t('header.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}


