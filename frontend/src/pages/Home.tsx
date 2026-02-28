import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsApi, type Product } from '../lib/api';

export function Home() {
  const { isAuthenticated, role, organizationName } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    productsApi
      .list(searchQuery || undefined)
      .then(setProducts)
      .catch((e) => {
        const errorMsg = e instanceof Error ? e.message : 'Failed to load products';
        setError(errorMsg);
        console.error('Products load error:', e);
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-14">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-canvas-alt)] via-[var(--color-surface)] to-[var(--color-canvas-alt)] p-8 shadow-inner sm:p-12 md:p-16">
          <div className="relative z-10">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl md:text-5xl">
              Discover Premium Products from Trusted Vendors
            </h1>
            <p className="mt-2 max-w-xl text-lg text-[var(--color-ink-muted)]">
              Shop from a curated marketplace featuring quality products and secure checkout.
            </p>
          </div>
        </section>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-medium">Unable to load products</p>
          <p className="mt-2 text-sm opacity-90">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              productsApi.list(searchQuery || undefined).then(setProducts).catch((e) => {
                setError(e instanceof Error ? e.message : 'Failed to load products');
              }).finally(() => setLoading(false));
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = role === 'STAFF' || role === 'ADMIN' || role === 'SUPERUSER';

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-canvas-alt)] via-[var(--color-surface)] to-[var(--color-canvas-alt)] p-8 shadow-inner sm:p-12 md:p-16">
        <div className="relative z-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl md:text-5xl">
            Discover Premium Products from Trusted Vendors
          </h1>
          {isStaffOrAdmin && organizationName ? (
            <p className="mt-3 text-lg text-[var(--color-accent)] font-medium">
              {organizationName}
            </p>
          ) : null}
          <p className="mt-2 max-w-xl text-lg text-[var(--color-ink-muted)]">
            Shop from a curated marketplace featuring quality products, secure checkout, and fast delivery. 
            Experience seamless shopping with multiple payment options including UPI and Cash on Delivery.
          </p>
          {!isAuthenticated && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-[var(--color-accent)] px-5 py-2.5 font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-3xl" aria-hidden />
        <div className="absolute top-1/4 right-1/4 h-24 w-24 rounded-full bg-[var(--color-accent)]/5 blur-2xl" aria-hidden />
      </section>

      <section>
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
            Products
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            {products.length > 0 && (
              <span className="text-sm text-[var(--color-ink-muted)]">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
            <p className="text-[var(--color-ink-muted)]">No products available yet.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/product/${p.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition hover:border-[var(--color-accent)] hover:shadow-lg"
                >
                  <div className="relative aspect-square overflow-hidden bg-[var(--color-canvas-alt)]">
                    {p.thumbnail ? (
                      <img
                        src={productsApi.getMediaUrl(p.thumbnail)}
                        alt={p.name}
                        className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-muted)]">
                        No image
                      </div>
                    )}
                    {p.discount_price && (
                      <span className="absolute left-3 top-3 rounded-full bg-[var(--color-badge)] px-2 py-0.5 text-xs font-bold text-white shadow">
                        Sale
                      </span>
                    )}
                    {p.is_in_stock ? (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                        In stock
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                      {p.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-[var(--color-ink-muted)]">
                      {p.description}
                    </p>
                    <p className="mt-2 text-xs font-medium">
                      {p.is_in_stock ? (
                        <span className="text-emerald-600 dark:text-emerald-400">In stock ({p.stock} available)</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Out of stock</span>
                      )}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xl font-bold text-[var(--color-accent)]">
                        ₹{p.discount_price ?? p.price}
                      </span>
                      {p.discount_price && (
                        <span className="text-sm text-[var(--color-ink-muted)] line-through">
                          ₹{p.price}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
