import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Se for usuário demo, retornar dados básicos
    if (authUser.userId.startsWith('demo-')) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: authUser.userId,
          email: authUser.email,
          name: authUser.name,
          role: authUser.role,
          permissions: authUser.permissions,
          isDemoUser: true,
        },
      });
    }

    // Buscar dados atualizados do usuário no banco
    try {
      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { authenticated: false, user: null, error: 'Usuário não encontrado' },
          { status: 200 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { authenticated: false, user: null, error: 'Usuário desativado' },
          { status: 200 }
        );
      }

      const permissions = user.role.permissions.map(rp => rp.permission.code);

      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          cargo: user.cargo,
          role: user.role.name,
          roleDisplayName: user.role.displayName,
          permissions,
          isDemoUser: user.isDemoUser,
          createdAt: user.createdAt,
        },
      });

    } catch (dbError) {
      // Se banco não estiver disponível, retornar dados do token
      console.error('Erro ao buscar usuário no banco:', dbError);

      return NextResponse.json({
        authenticated: true,
        user: {
          id: authUser.userId,
          email: authUser.email,
          name: authUser.name,
          role: authUser.role,
          permissions: authUser.permissions,
          isDemoUser: authUser.userId.startsWith('demo-'),
        },
      });
    }

  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Erro ao verificar sessão' },
      { status: 500 }
    );
  }
}
