import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminOrdersApi, type OrderListItem } from '../../lib/api';

export function AdminDashboard() {
  const { role } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminOrdersApi
      .list()
      .then((res) => setOrders(res.orders ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    CANCELLED: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">
          Orders
        </h1>
      </div>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">No orders yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
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
