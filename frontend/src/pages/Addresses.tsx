import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressApi, type Address } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Addresses() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
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
    addressApi
      .list()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, role, navigate]);

  const resetForm = () => {
    setForm({
      full_name: '',
      phone_number: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false,
    });
    setEditing(null);
    setError(null);
  };

  const loadEdit = (a: Address) => {
    setEditing(a);
    setForm({
      full_name: a.full_name,
      phone_number: a.phone_number,
      street_address: a.street_address,
      city: a.city,
      state: a.state,
      postal_code: a.postal_code,
      country: a.country,
      is_default: a.is_default,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await addressApi.update(editing.id, form);
      } else {
        await addressApi.create(form);
      }
      const list = await addressApi.list();
      setAddresses(list);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressApi.delete(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      if (editing?.id === id) resetForm();
    } catch {
      setError('Failed to delete');
    }
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
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Addresses</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{addr.full_name}</p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code},{' '}
                    {addr.country}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)]">{addr.phone_number}</p>
                  {addr.is_default && (
                    <span className="mt-1 inline-block text-xs font-medium text-[var(--color-accent)]">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadEdit(addr)}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
            {editing ? 'Edit address' : 'Add address'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Full name
              </label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Phone (10–15 digits)
              </label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                required
                pattern="[0-9]{10,15}"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Street address
              </label>
              <input
                value={form.street_address}
                onChange={(e) => setForm((f) => ({ ...f, street_address: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)]">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)]">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)]">
                  Postal code
                </label>
                <input
                  value={form.postal_code}
                  onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)]">Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-ink)]">Set as default</span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas-alt)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
