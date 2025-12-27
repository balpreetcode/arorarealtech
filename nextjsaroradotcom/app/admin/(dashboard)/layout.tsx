import type { CSSProperties } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, isValidAdminSession } from '@/lib/admin-auth';

async function logout() {
  'use server';

  const cookieStore = cookies();
  cookieStore.delete({
    name: ADMIN_COOKIE_NAME,
    path: '/admin',
  });

  redirect('/admin/login');
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!isValidAdminSession(sessionCookie?.value)) {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Arora Real Tech Admin</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5f5' }}>
            Manage properties, news, maps, and static pages
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            style={{
              backgroundColor: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Log out
          </button>
        </form>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav
          style={{
            width: '220px',
            borderRight: '1px solid #e2e8f0',
            padding: '1.5rem 1rem',
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>
              <Link href="/admin" style={linkStyle}>
                Dashboard Overview
              </Link>
            </li>
            <li>
              <Link href="/admin/properties" style={linkStyle}>
                Manage Properties
              </Link>
            </li>
            <li>
              <Link href="/admin/news" style={linkStyle}>
                Manage News
              </Link>
            </li>
            <li>
              <Link href="/admin/maps" style={linkStyle}>
                Manage Maps Page
              </Link>
            </li>
            <li>
              <Link href="/admin/pages/about-us" style={linkStyle}>
                Edit About Us
              </Link>
            </li>
            <li>
              <Link href="/admin/pages/contact-us" style={linkStyle}>
                Edit Contact Us
              </Link>
            </li>
            <li>
              <Link href="/admin/pages/list-of-useful-websites" style={linkStyle}>
                Edit Useful Websites
              </Link>
            </li>
          </ul>
        </nav>
        <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f8fafc' }}>{children}</main>
      </div>
    </div>
  );
}

const linkStyle: CSSProperties = {
  display: 'block',
  padding: '0.5rem 0.75rem',
  borderRadius: '4px',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
  backgroundColor: '#e2e8f0',
};
