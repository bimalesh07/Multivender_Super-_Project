import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, type OrderListItem } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  CANCELLED: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
};

export function Orders() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role && role !== 'CUSTOMER') {
      navigate('/admin');
      return;
    }
    ordersApi
      .history()
      .then((res) => setOrders(res.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Order history</h1>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">You haven't placed any orders yet.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 text-[var(--color-accent)] hover:underline"
          >
            Start shopping
          </button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-nowrap"
            >
              <div>
                <p className="font-medium text-[var(--color-ink)]">
                  {order.product_names?.length
                    ? order.product_names.join(', ')
                    : '—'}
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusColors[order.status] ?? 'bg-[var(--color-canvas-alt)] text-[var(--color-ink-muted)]'
                  }`}
                >
                  {order.status}
                </span>
                <span className="font-bold text-[var(--color-ink)]">
                  ₹{order.total_amount}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
