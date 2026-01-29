import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUser } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    // Obter usuário atual para log
    const user = await getAuthUser();

    // Limpar cookie
    await clearAuthCookie();

    // Registrar logout no ActivityLog (se usuário existir e não for demo)
    if (user && !user.userId.startsWith('demo-')) {
      try {
        await prisma.activityLog.create({
          data: {
            type: 'USER_LOGOUT',
            description: `Usuário ${user.name} fez logout`,
            userId: user.userId,
          }
        });
      } catch {
        // Log error mas não falha o logout
        console.error('Erro ao registrar logout no ActivityLog');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

  } catch (error) {
    console.error('Erro no logout:', error);

    // Mesmo com erro, tenta limpar o cookie
    try {
      await clearAuthCookie();
    } catch {
      // Ignora erro na limpeza
    }

    return NextResponse.json({
      success: true,
      message: 'Logout realizado',
    });
  }
}
