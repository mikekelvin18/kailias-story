// Are jump links (/go/...) switched on? Only on Vercel preview builds, local
// development, or when KAILIA_JUMP_LINKS=on is set. Never on the real
// public site (Vercel production). Read on the server at request time.
export function jumpLinksEnabled(): boolean {
  if (process.env.VERCEL_ENV === 'production') return false;
  return process.env.VERCEL_ENV === 'preview'
    || process.env.NODE_ENV === 'development'
    || process.env.KAILIA_JUMP_LINKS === 'on';
}
