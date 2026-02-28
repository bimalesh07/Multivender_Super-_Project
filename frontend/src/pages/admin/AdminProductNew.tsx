import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminProductsApi, type CreateProductForm } from '../../lib/api';

export function AdminProductNew() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateProductForm>({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: 0,
    sku: '',
    manufacturer: '',
    material: '',
    product_type: '',
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminProductsApi.create({
        ...form,
        price: form.price,
        discount_price: form.discount_price || undefined,
        stock: form.stock ?? 0,
        sku: form.sku || undefined,
        thumbnail: thumbnail ?? undefined,
        manufacturer: form.manufacturer || undefined,
        material: form.material || undefined,
        product_type: form.product_type || undefined,
      });
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Add product</h1>
      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-100 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)]">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)]">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={4}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">
              Discount price (optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.discount_price ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value, 10) || 0 }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">SKU (optional)</label>
            <input
              value={form.sku ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">Manufacturer (optional)</label>
            <input
              value={form.manufacturer ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">Material (optional)</label>
            <input
              value={form.material ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)]">Product Type (optional)</label>
            <input
              value={form.product_type ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, product_type: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)]">
            Thumbnail (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] file:mr-4 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:text-white file:hover:opacity-90"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
