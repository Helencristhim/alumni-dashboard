import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser, hasPermission as checkPermission } from '@/lib/auth/jwt';

// GET - Lista todos os roles
export async function GET() {
  try {
    // Verificar autenticacao
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Verificar permissao
    if (!checkPermission(authUser, 'admin:users:manage')) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    // Buscar roles com contagem de usuarios
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        },
        permissions: {
          include: {
            permission: {
              select: {
                code: true,
                description: true,
                category: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Formatar resposta
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      userCount: role._count.users,
      permissions: role.permissions.map(rp => ({
        code: rp.permission.code,
        description: rp.permission.description,
        category: rp.permission.category,
      })),
    }));

    return NextResponse.json({ roles: formattedRoles });

  } catch (error) {
    console.error('Erro ao listar roles:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
