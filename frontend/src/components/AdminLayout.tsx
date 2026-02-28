import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect } from 'react';

const ADMIN_ROLES = ['ADMIN', 'STAFF', 'SUPERUSER'];

export function AdminLayout() {
  const { isAuthenticated, role, logout, organizationName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = role && ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              to="/admin"
              className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)] no-underline"
            >
              {role === 'STAFF' ? 'Staff panel' : 'Admin panel'}
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/admin"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/orders"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                Orders
              </Link>
              <Link
                to="/admin/products/new"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                Add product
              </Link>
              <Link
                to="/"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                View shop
              </Link>
              <Link
                to="/admin/profile"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {organizationName && (
              <span className="max-w-[120px] truncate rounded-md border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] sm:max-w-[180px]" title={organizationName}>
                {organizationName}
              </span>
            )}
            <span className="rounded bg-[var(--color-accent-muted)] px-2 py-1 text-xs font-medium text-[var(--color-accent)]">
              {role === 'STAFF' ? 'Staff' : role === 'SUPERUSER' ? 'SuperUser' : 'Admin'}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--color-ink-muted)] transition hover:bg-[var(--color-canvas-alt)] hover:text-[var(--color-ink)]"
              aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-[var(--color-canvas-alt)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-border)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
