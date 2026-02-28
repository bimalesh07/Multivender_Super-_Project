import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { cartApi, type CartViewResponse } from '../lib/api';

export function Layout() {
  const { isAuthenticated, logout, role, organizationName, userDisplayName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartViewResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    cartApi.view().then(setCart).catch(() => setCart(null));
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)] no-underline"
          >
            MultiVendor
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            >
              Shop
            </Link>
            {isAuthenticated && (role === 'ADMIN' || role === 'STAFF' || role === 'SUPERUSER') && (
              <Link
                to="/admin"
                className="text-sm font-medium text-[var(--color-accent)] transition hover:opacity-90"
              >
                {role === 'STAFF' ? 'Staff panel' : 'Admin panel'}
              </Link>
            )}
            {isAuthenticated && role === 'CUSTOMER' && (
              <>
                <Link
                  to="/cart"
                  className="relative flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Cart
                  {cart && cart.total_items_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-xs font-semibold text-white">
                      {cart.total_items_count}
                    </span>
                  )}
                </Link>
                <Link
                  to="/wishlist"
                  className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Wishlist
                </Link>
                <Link
                  to="/orders"
                  className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Orders
                </Link>
                <Link
                  to="/addresses"
                  className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Addresses
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Profile
                </Link>
              </>
            )}
            {isAuthenticated && (role === 'ADMIN' || role === 'STAFF' || role === 'SUPERUSER') && (
              <Link
                to="/profile"
                className="text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                Profile
              </Link>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--color-ink-muted)] transition hover:bg-[var(--color-canvas-alt)] hover:text-[var(--color-ink)]"
              aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
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
            {isAuthenticated ? (
              <span className="flex flex-wrap items-center justify-end gap-2">
                {(role === 'STAFF' || role === 'ADMIN' || role === 'SUPERUSER') && organizationName && (
                  <span className="max-w-[140px] truncate rounded-md border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)]/30 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] sm:max-w-[200px]" title={organizationName}>
                    {organizationName}
                  </span>
                )}
                <span className="rounded bg-[var(--color-canvas-alt)] px-2 py-1 text-xs font-medium text-[var(--color-ink-muted)]">
                  {role === 'STAFF' ? 'Staff' : role === 'ADMIN' ? 'Admin' : role === 'SUPERUSER' ? 'SuperUser' : (userDisplayName ?? 'Customer')}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-[var(--color-canvas-alt)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-border)]"
                >
                  Logout
                </button>
              </span>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
