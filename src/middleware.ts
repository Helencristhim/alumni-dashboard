import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Nome do cookie de autenticação
const AUTH_COOKIE_NAME = 'alumni_auth_token';

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/login'];

// Mapeamento de rotas para permissões necessárias
const routePermissions: Record<string, string[]> = {
  '/vendas-b2c': ['module:vendas-b2c:view'],
  '/vendas-b2b': ['module:vendas-b2b:view'],
  '/customer-care': ['module:customer-care:view'],
  '/cancelamentos': ['module:cancelamentos:view'],
  '/cobranca': ['module:cobranca:view'],
  '/alunos-ativos': ['module:alunos-ativos:view'],
  '/marketing': ['module:marketing:view'],
  '/admin/usuarios': ['admin:users:manage'],
  '/configuracoes': ['admin:config:view'],
  '/atividades': ['activity:view:own', 'activity:view:all'],
};

// Interface do payload do token
interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Obter a chave secreta do JWT
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return new TextEncoder().encode(secret);
}

// Verificar token JWT
async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Verificar se usuário tem permissão
function hasPermission(user: TokenPayload, permission: string): boolean {
  // ADM tem todas as permissões
  if (user.role === 'ADM') return true;

  // Verifica permissão exata
  if (user.permissions.includes(permission)) return true;

  // Verifica permissão com wildcard (ex: module:*:view)
  const parts = permission.split(':');
  if (parts.length === 3) {
    const wildcardPerm = `${parts[0]}:*:${parts[2]}`;
    if (user.permissions.includes(wildcardPerm)) return true;
  }

  return false;
}

// Verificar se usuário pode acessar rota
function canAccessRoute(user: TokenPayload, pathname: string): boolean {
  // Encontrar permissões necessárias para a rota
  const matchedRoute = Object.keys(routePermissions).find(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchedRoute) {
    // Rota não tem permissão específica, permitir acesso
    return true;
  }

  const requiredPermissions = routePermissions[matchedRoute];

  // Usuário precisa ter pelo menos uma das permissões listadas
  return requiredPermissions.some(perm => hasPermission(user, perm));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso a rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permite acesso a arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Permite acesso a APIs (elas têm sua própria autenticação)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Verificar modo demo (fallback para client-side auth)
  const demoModeEnabled = process.env.ENABLE_DEMO_MODE?.trim() === 'true';

  // Obter token do cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Se não há token
  if (!token) {
    // Se modo demo está ativo, permitir acesso (auth será feita client-side)
    if (demoModeEnabled) {
      return NextResponse.next();
    }

    // Redirecionar para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar token
  const user = await verifyToken(token);

  if (!user) {
    // Token inválido
    if (demoModeEnabled) {
      // Limpar cookie inválido e permitir acesso (auth client-side)
      const response = NextResponse.next();
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // Redirecionar para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permissões para a rota
  if (!canAccessRoute(user, pathname)) {
    // Usuário não tem permissão para esta rota
    // Redirecionar para home ou página de acesso negado
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Adicionar informações do usuário nos headers (opcional, para uso nas páginas)
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.userId);
  response.headers.set('x-user-role', user.role);

  return response;
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
