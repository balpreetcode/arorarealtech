import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  getAdminSessionToken,
  isValidAdminSession,
  verifyAdminCredentials,
} from '@/lib/admin-auth';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function login(formData: FormData) {
  'use server';

  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    if (!verifyAdminCredentials(username, password)) {
      redirect('/admin/login?error=invalid');
    }
  } catch (error) {
    console.error('Admin login failed:', error);
    redirect('/admin/login?error=config');
  }

  const cookieStore = cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: 60 * 60 * 12, // 12 hours
  });

  redirect('/admin');
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (isValidAdminSession(sessionCookie?.value)) {
    redirect('/admin');
  }

  const error = typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : null;

  return (
    <div style={{ maxWidth: '420px', margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Admin Login</h1>

      {error === 'invalid' && (
        <p style={{ color: '#b3261e', marginBottom: '1rem' }}>
          Invalid username or password. Please try again.
        </p>
      )}

      {error === 'config' && (
        <p style={{ color: '#b3261e', marginBottom: '1rem' }}>
          Admin credentials are not configured. Set <code>ADMIN_PASSWORD</code> in your environment.
        </p>
      )}

      <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="username" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue="admin"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.75rem',
            backgroundColor: '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
