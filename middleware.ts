import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/supabase';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/verify-email',
    '/reset-password',
    '/pricing',
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/verify-email',
    '/api/auth/reset-password',
    '/api/stripe/webhook',
  ];

  // Se é uma rota pública, permitir acesso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o token é válido
  const decoded = verifyToken(token);
  if (!decoded) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Para rotas protegidas, verificar status do usuário
  const protectedRoutes = ['/dashboard', '/account', '/billing', '/checkout'];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Aqui você pode adicionar lógica adicional para verificar status do usuário
    // Por exemplo, redirecionar para /pricing se status não for ativo nem trial
    
    // Por enquanto, apenas permitir acesso se autenticado
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};