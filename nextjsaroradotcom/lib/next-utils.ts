export function isRedirectError(error: unknown): error is Error & { digest: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;

  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}
