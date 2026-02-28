import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi, productsApi, type CartViewResponse, type CartItemView } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Cart() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role && role !== 'CUSTOMER') {
      navigate('/admin');
      return;
    }
    cartApi
      .view()
      .then(setCart)
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, role, navigate]);

  const updateQty = (item: CartItemView, delta: number) => {
    const newQty = Math.max(1, Math.min(item.stock_available, item.quantity + delta));
    if (newQty === item.quantity) return;
    setUpdating(item.id);
    cartApi
      .updateItem(item.id, newQty)
      .then(() => cartApi.view().then(setCart))
      .finally(() => setUpdating(null));
  };

  const remove = (itemId: string) => {
    setUpdating(itemId);
    cartApi
      .removeItem(itemId)
      .then(() => cartApi.view().then(setCart))
      .finally(() => setUpdating(null));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
          Your cart is empty
        </h2>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Add items from the shop to checkout.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Shopping cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center"
            >
              <Link
                to={`/product/${item.product_id}`}
                className="flex h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--color-canvas-alt)]"
              >
                {item.product_thumbnail ? (
                  <img
                    src={productsApi.getMediaUrl(item.product_thumbnail)}
                    alt={item.product_name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-muted)] text-xs">
                    No image
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${item.product_id}`}
                  className="font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  {item.product_name}
                </Link>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  ₹{item.unit_price} × {item.quantity} = ₹{item.subtotal}
                </p>
                {item.is_stock_problem && (
                  <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Quantity exceeds available stock ({item.stock_available})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => updateQty(item, -1)}
                    disabled={updating === item.id || item.quantity <= 1}
                    className="px-3 py-1 text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)] disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item, 1)}
                    disabled={updating === item.id || item.quantity >= item.stock_available}
                    className="px-3 py-1 text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)] disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={updating === item.id}
                  className="rounded p-2 text-[var(--color-ink-muted)] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
                  aria-label="Remove"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
              Order summary
            </h2>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              {cart.total_items_count} item{cart.total_items_count !== 1 ? 's' : ''}
            </p>
            <p className="mt-4 text-2xl font-bold text-[var(--color-ink)]">
              Total: ₹{cart.total_price}
            </p>
            <Link
              to="/checkout"
              className="mt-6 block w-full rounded-lg bg-[var(--color-accent)] py-3 text-center font-semibold text-white transition hover:opacity-90"
            >
              Proceed to checkout
            </Link>
            <Link
              to="/"
              className="mt-3 block text-center text-sm text-[var(--color-accent)] hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
