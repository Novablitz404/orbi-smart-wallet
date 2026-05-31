import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  // Redirect bare keys.orbiwallet.xyz to account.orbiwallet.xyz
  if (host === 'keys.orbiwallet.xyz' && request.nextUrl.pathname === '/') {
    return NextResponse.redirect('https://account.orbiwallet.xyz', { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
