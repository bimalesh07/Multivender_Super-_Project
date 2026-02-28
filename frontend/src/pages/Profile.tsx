import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';

interface ProfileData {
  id: string;
  email: string;
  role: string;
  organization: string | null;
  created_at: string | null;
}

export function Profile() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    authApi
      .profile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Profile</h1>
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-[var(--color-ink-muted)]">Email</label>
            <p className="mt-1 text-lg text-[var(--color-ink)]">{profile.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-ink-muted)]">Role</label>
            <p className="mt-1 text-lg text-[var(--color-ink)]">{profile.role}</p>
          </div>
          {profile.organization && (
            <div>
              <label className="text-sm font-medium text-[var(--color-ink-muted)]">Organization</label>
              <p className="mt-1 text-lg text-[var(--color-ink)]">{profile.organization}</p>
            </div>
          )}
          {profile.created_at && (
            <div>
              <label className="text-sm font-medium text-[var(--color-ink-muted)]">Member since</label>
              <p className="mt-1 text-lg text-[var(--color-ink)]">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
