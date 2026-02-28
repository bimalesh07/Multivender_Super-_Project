import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, wishlistApi, type Product } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wishlistAdding, setWishlistAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsApi
      .get(id)
      .then((p) => {
        setProduct(p);
        setSelectedImageIndex(0);
        if (id) {
          setRelatedLoading(true);
          productsApi
            .getRelated(id)
            .then(setRelatedProducts)
            .catch((e) => {
              console.error('Related products error:', e);
              setRelatedProducts([]);
            })
            .finally(() => setRelatedLoading(false));
        }
      })
      .catch((e) => {
        const errorMsg = e instanceof Error ? e.message : 'Failed to load product';
        setError(errorMsg);
        console.error('Product load error:', e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    cartApi
      .add(product.id, quantity)
      .then(() => navigate('/cart'))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to add'))
      .finally(() => setAdding(false));
  };

  const handleAddToWishlist = () => {
    if (!product || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setWishlistAdding(true);
    wishlistApi
      .add(product.id)
      .then(() => navigate('/wishlist'))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to add'))
      .finally(() => setWishlistAdding(false));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
        <p>{error ?? 'Product not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-[var(--color-accent)] hover:underline"
        >
          Back to shop
        </button>
      </div>
    );
  }

  const allImages = product.images && product.images.length > 0 
    ? product.images.map(img => productsApi.getMediaUrl(img.image))
    : product.thumbnail 
    ? [productsApi.getMediaUrl(product.thumbnail)]
    : [];

  const currentImage = allImages[selectedImageIndex] || '';

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="aspect-square bg-[var(--color-canvas-alt)]">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--color-ink-muted)]">
                  No image
                </div>
              )}
            </div>
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedImageIndex === idx
                      ? 'border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-ink-muted)]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">
            {product.name}
          </h1>
          {product.sku && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              SKU: {product.sku}
            </p>
          )}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--color-accent)]">
              ₹{product.discount_price ?? product.price}
            </span>
            {product.discount_price && (
              <span className="text-xl text-[var(--color-ink-muted)] line-through">
                ₹{product.price}
              </span>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--color-ink)]">Description</h3>
              <p className="mt-2 text-[var(--color-ink-muted)] leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>
            {(product.manufacturer || product.material || product.product_type) && (
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas-alt)] p-4">
                <h3 className="mb-3 font-semibold text-[var(--color-ink)]">Product Highlights</h3>
                <div className="space-y-2 text-sm">
                  {product.manufacturer && (
                    <div className="flex">
                      <span className="w-32 font-medium text-[var(--color-ink-muted)]">Manufacturer:</span>
                      <span className="text-[var(--color-ink)]">{product.manufacturer}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex">
                      <span className="w-32 font-medium text-[var(--color-ink-muted)]">Material:</span>
                      <span className="text-[var(--color-ink)]">{product.material}</span>
                    </div>
                  )}
                  {product.product_type && (
                    <div className="flex">
                      <span className="w-32 font-medium text-[var(--color-ink-muted)]">Type:</span>
                      <span className="text-[var(--color-ink)]">{product.product_type}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <h3 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-200">Payment Options</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  UPI Available
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cash on Delivery
                </span>
              </div>
            </div>
            <p className="mt-4">
              {product.is_in_stock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  In stock — {product.stock} available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Out of stock
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-lg border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)]"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="px-4 py-2 text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)] disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.is_in_stock || adding}
                className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={handleAddToWishlist}
                disabled={wishlistAdding}
                className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-canvas-alt)] disabled:opacity-50"
              >
                {wishlistAdding ? "Adding…" : "Add to wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 className="mb-6 font-display text-2xl font-bold text-[var(--color-ink)]">
            Related Products
          </h2>
          {relatedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
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
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                        {p.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-[var(--color-accent)]">
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
        </div>
      )}
    </div>
  );
}
