import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  // Jika APP_URL diisi dan alamat saat ini berbeda (misalnya alamat cabang/preview Vercel),
  // pindah dulu ke domain utama agar redirect_uri dan cookie sesi konsisten.
  const main = process.env.APP_URL?.replace(/\/+$/, '');
  if (main && main !== origin) return NextResponse.redirect(main + '/api/strava/login');
  // Mode relay: jika STRAVA_REDIRECT_URI diisi (callback milik aplikasi lain yang domainnya terdaftar di Strava),
  // login diarahkan ke sana dan state diberi awalan 'studio~' agar aplikasi itu meneruskan hasilnya ke sini.
  const relay = process.env.STRAVA_REDIRECT_URI;
  const state = (relay ? 'studio~' : '') + crypto.randomUUID();
  const u = new URL('https://www.strava.com/oauth/authorize');
  u.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!);
  u.searchParams.set('redirect_uri', relay || origin + '/api/strava/callback');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('approval_prompt', 'auto');
  u.searchParams.set('scope', 'read,activity:read_all');
  u.searchParams.set('state', state);
  const res = NextResponse.redirect(u);
  res.cookies.set('strava_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}
