import crypto from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'admin-auth';

function normalize(value: string): string {
  return value.trim();
}

function getAdminUsername(): string {
  return normalize(process.env.ADMIN_USERNAME || 'admin');
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD is not configured. Set it in your environment before using the admin panel.');
  }

  return normalize(password);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = getAdminUsername();
  const expectedPassword = getAdminPassword();

  return (
    timingSafeEqual(normalize(username).toLowerCase(), expectedUsername.toLowerCase()) &&
    timingSafeEqual(password, expectedPassword)
  );
}

export function getAdminSessionToken(): string {
  const username = getAdminUsername();
  const password = getAdminPassword();

  return crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  try {
    return timingSafeEqual(token, getAdminSessionToken());
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
