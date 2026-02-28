import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistApi, type WishlistItem } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Wishlist() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role && role !== 'CUSTOMER') {
      navigate('/admin');
      return;
    }
    wishlistApi
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, role, navigate]);

  const remove = (productId: string) => {
    setRemoving(productId);
    wishlistApi
      .remove(productId)
      .then(() => setItems((prev) => prev.filter((i) => i.product !== productId)))
      .finally(() => setRemoving(null));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Your wishlist is empty
        </h2>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Save items you like for later.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Wishlist</h1>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <Link
              to={`/product/${item.product}`}
              className="block flex-1 p-4"
            >
              <h3 className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]">
                {item.product_name}
              </h3>
              <p className="mt-1 text-lg font-bold text-[var(--color-accent)]">
                ₹{item.product_price}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Added {new Date(item.added_at).toLocaleDateString()}
              </p>
            </Link>
            <div className="flex border-t border-[var(--color-border)]">
              <Link
                to={`/product/${item.product}`}
                className="flex-1 py-3 text-center text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-canvas-alt)]"
              >
                View product
              </Link>
              <button
                type="button"
                onClick={() => remove(item.product)}
                disabled={removing === item.product}
                className="flex-1 py-3 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
              >
                {removing === item.product ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
