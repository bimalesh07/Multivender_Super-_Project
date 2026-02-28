import { useEffect, useState } from 'react';
import { adminOrdersApi, type OrderListItem } from '../../lib/api';

const STATUS_OPTIONS = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  CANCELLED: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = () => {
    adminOrdersApi
      .list()
      .then((res) => setOrders(res.orders ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    adminOrdersApi
      .updateStatus(orderId, newStatus)
      .then(() => fetchOrders())
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to update'))
      .finally(() => setUpdating(null));
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
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Orders</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Change status so customers see updates in their Order history.
      </p>
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-ink-muted)]">No orders yet.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-canvas-alt)]">
                  <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Products</th>
                  <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Date</th>
                  <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Total</th>
                  <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[var(--color-ink)]">Change to</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-ink)]">
                      {order.product_names?.length ? order.product_names.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                      ₹{order.total_amount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[order.status] ?? 'bg-[var(--color-canvas-alt)] text-[var(--color-ink-muted)]'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {updating === order.id && (
                        <span className="ml-2 text-xs text-[var(--color-ink-muted)]">Updating…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
