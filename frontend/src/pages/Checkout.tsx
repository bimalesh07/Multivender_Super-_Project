import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi, addressApi, ordersApi, type CartViewResponse, type Address } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Checkout() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartViewResponse | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH_ON_DELIVERY');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (role && role !== 'CUSTOMER') {
      navigate('/admin');
      return;
    }
    Promise.all([cartApi.view(), addressApi.list()])
      .then(([c, a]) => {
        setCart(c);
        setAddresses(a);
        const defaultAddr = a.find((x) => x.is_default);
        setSelectedAddressId(defaultAddr?.id ?? a[0]?.id ?? null);
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, role, navigate]);

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    setError(null);
    setPlacing(true);
    try {
      await ordersApi.place(selectedAddressId ?? undefined, paymentMethod);
      navigate('/orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
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
        <p className="text-[var(--color-ink-muted)]">Your cart is empty.</p>
        <Link to="/" className="mt-4 inline-block text-[var(--color-accent)] hover:underline">
          Go to shop
        </Link>
      </div>
    );
  }

  const canPlace = addresses.length > 0 && (selectedAddressId || addresses.some((a) => a.is_default));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Shipping address
          </h2>
          {addresses.length === 0 ? (
            <p className="mt-2 text-[var(--color-ink-muted)]">
              No addresses. Add one in{' '}
              <Link to="/addresses" className="text-[var(--color-accent)] hover:underline">
                Addresses
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {addresses.map((addr) => (
                <li
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selectedAddressId === addr.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]/20'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-ink-muted)]'
                  }`}
                >
                  <p className="font-medium text-[var(--color-ink)]">{addr.full_name}</p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code},{' '}
                    {addr.country}
                  </p>
                  {addr.is_default && (
                    <span className="mt-1 inline-block text-xs font-medium text-[var(--color-accent)]">
                      Default
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/addresses"
            className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline"
          >
            Manage addresses
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            Order summary
          </h2>
          <p className="mt-1 text-[var(--color-ink-muted)]">
            {cart.total_items_count} item{cart.total_items_count !== 1 ? 's' : ''}
          </p>
          <p className="mt-4 text-2xl font-bold text-[var(--color-ink)]">
            Total: ₹{cart.total_price}
          </p>
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-[var(--color-ink)]">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-canvas-alt)]">
                <input
                  type="radio"
                  name="payment"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-[var(--color-accent)]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[var(--color-ink)]">Cash on Delivery</span>
                  <p className="text-xs text-[var(--color-ink-muted)]">Pay when you receive</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-canvas-alt)]">
                <input
                  type="radio"
                  name="payment"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-[var(--color-accent)]"
                />
                <div className="flex-1">
                  <span className="font-medium text-[var(--color-ink)]">UPI</span>
                  <p className="text-xs text-[var(--color-ink-muted)]">Pay instantly via UPI</p>
                </div>
              </label>
            </div>
          </div>
          {error && (
            <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!canPlace || placing}
            className="mt-6 w-full rounded-lg bg-[var(--color-accent)] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {placing ? 'Placing order…' : 'Place order'}
          </button>
          <Link
            to="/cart"
            className="mt-3 block text-center text-sm text-[var(--color-accent)] hover:underline"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
