import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Root sayfadan dashboard'a yönlendir
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Ana sayfa ve public sayfalar için token kontrolü yapma
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname === '/login' || 
            req.nextUrl.pathname === '/register') {
          return true
        }
        // Diğer sayfalar için token gerekli
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 