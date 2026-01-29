import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// Nome do cookie de autenticacao
export const AUTH_COOKIE_NAME = 'alumni_auth_token';

// Payload do JWT
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Dados do usuario extraidos do token
export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Obtem a chave secreta do JWT
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET nao configurado nas variaveis de ambiente');
  }
  return new TextEncoder().encode(secret);
}

// Tempo de expiracao do token
function getExpirationTime(): string {
  return (process.env.JWT_EXPIRES_IN || '24h').trim();
}

/**
 * Assina um JWT com os dados do usuario
 */
export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = getJwtSecret();
  const expiresIn = getExpirationTime();

  const token = await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verifica e decodifica um JWT
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Decodifica um JWT sem verificar a assinatura (para debug)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Define o cookie de autenticacao (Server Action ou API Route)
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresIn = getExpirationTime();

  // Calcula a data de expiracao
  let maxAge = 24 * 60 * 60; // 24 horas em segundos
  if (expiresIn.endsWith('h')) {
    maxAge = parseInt(expiresIn) * 60 * 60;
  } else if (expiresIn.endsWith('d')) {
    maxAge = parseInt(expiresIn) * 24 * 60 * 60;
  }

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

/**
 * Remove o cookie de autenticacao (Server Action ou API Route)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Obtem o token do cookie (Server Action ou API Route)
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Obtem o usuario autenticado a partir do cookie (Server Action ou API Route)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    permissions: payload.permissions,
  };
}

/**
 * Verifica se o usuario tem uma permissao especifica
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;

  // ADM tem todas as permissoes
  if (user.role === 'ADM') return true;

  // Verifica permissao exata
  if (user.permissions.includes(permission)) return true;

  // Verifica permissao com wildcard (ex: module:*:view)
  const parts = permission.split(':');
  if (parts.length === 3) {
    const wildcardPerm = `${parts[0]}:*:${parts[2]}`;
    if (user.permissions.includes(wildcardPerm)) return true;
  }

  return false;
}

/**
 * Verifica se o usuario pode acessar um modulo especifico
 */
export function canAccessModule(user: AuthUser | null, moduleId: string): boolean {
  return hasPermission(user, `module:${moduleId}:view`);
}
