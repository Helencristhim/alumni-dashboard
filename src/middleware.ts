import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso a rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permite acesso a arquivos estáticos e API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Verifica token de autenticação (via cookie ou header)
  // Em produção, validar JWT no servidor
  // Para demo, aceitamos qualquer requisição ao dashboard
  // A validação real acontece no cliente

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
