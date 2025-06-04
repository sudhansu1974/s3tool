import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAuthenticated = request.cookies.get('auth');
    const isLoginPage = request.nextUrl.pathname === '/';

    if (!isAuthenticated && !isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL('/query', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
