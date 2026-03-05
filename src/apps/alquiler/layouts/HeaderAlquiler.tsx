import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Menu, X, Search, LogIn, LogOut, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrandingPublico } from '@/features/alquiler-publico/hooks/useBrandingPublico';
import { useAuthClienteStore, selectIsAuthenticated } from '@/store/authCliente.store';

interface NavItem {
  to?: string;
  icon: LucideIcon;
  labelKey: string;
  onClick?: () => void;
}

export function HeaderAlquiler() {
  const { t } = useTranslation();
  const { branding } = useBrandingPublico();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const isAuthenticated = useAuthClienteStore(selectIsAuthenticated);

  const handleLogout = useCallback(() => {
    useAuthClienteStore.getState().logout();
    navigate('/');
  }, [navigate]);

  const navItems = useMemo<NavItem[]>(() => [
    { to: '/', icon: Search, labelKey: 'alquilerPublico.nav.buscar' },
    ...(isAuthenticated
      ? [
          { to: '/mis-reservas', icon: User, labelKey: 'alquilerPublico.nav.miCuenta' },
          { icon: LogOut, labelKey: 'alquilerPublico.nav.cerrarSesion', onClick: handleLogout },
        ]
      : [{ to: '/login', icon: LogIn, labelKey: 'alquilerPublico.nav.iniciarSesion' }]),
  ], [isAuthenticated, handleLogout]);

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.organizacionNombre}
                className="h-8 w-auto"
              />
            ) : (
              <Car className="w-8 h-8" />
            )}
            <span className="font-bold text-xl hidden sm:inline">
              {branding.organizacionNombre}
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ to, icon: Icon, labelKey, onClick }) =>
              to ? (
                <Link key={labelKey} to={to} className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
                  <Icon size={16} />
                  {t(labelKey)}
                </Link>
              ) : (
                <button key={labelKey} onClick={onClick} className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
                  <Icon size={16} />
                  {t(labelKey)}
                </button>
              )
            )}
          </nav>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden p-2 text-text-muted hover:text-text"
            aria-label={menuAbierto ? t('alquilerPublico.nav.cerrarMenu') : t('alquilerPublico.nav.abrirMenu')}
          >
            {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Nav mobile */}
        {menuAbierto && (
          <nav className="md:hidden py-4 border-t border-border animate-slide-in">
            <div className="flex flex-col gap-4">
              {navItems.map(({ to, icon: Icon, labelKey, onClick }) =>
                to ? (
                  <Link
                    key={labelKey}
                    to={to}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                    onClick={() => setMenuAbierto(false)}
                  >
                    <Icon size={16} />
                    {t(labelKey)}
                  </Link>
                ) : (
                  <button
                    key={labelKey}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                    onClick={() => { setMenuAbierto(false); onClick?.(); }}
                  >
                    <Icon size={16} />
                    {t(labelKey)}
                  </button>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
