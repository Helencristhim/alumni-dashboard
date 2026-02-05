import { NextRequest, NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';

// Demo users para modo de compatibilidade (fallback quando banco não disponível)
const DEMO_USERS = [
  { email: 'adm@alumni.com', password: 'Alumni@2024', name: 'Administrador', cargo: 'Diretor de TI', role: 'ADM', permissions: ['*'] },
  { email: 'ceo@alumni.com', password: 'Alumni@2024', name: 'CEO', cargo: 'CEO', role: 'ADM', permissions: ['*'] },
  { email: 'investidor@alumni.com', password: 'Alumni@2024', name: 'Investidor', cargo: 'Investidor', role: 'Investidor', permissions: ['module:overview:view', 'module:vendas-b2c:view', 'module:vendas-b2b:view', 'module:customer-care:view', 'module:cancelamentos:view', 'module:cobranca:view', 'module:alunos-ativos:view', 'module:marketing:view', 'activity:view:all'] },
  { email: 'viewer@alumni.com', password: 'Alumni@2024', name: 'Visualizador', cargo: 'Analista', role: 'Investidor', permissions: ['module:overview:view', 'module:vendas-b2c:view', 'module:vendas-b2b:view', 'module:customer-care:view', 'module:cancelamentos:view', 'module:cobranca:view', 'module:alunos-ativos:view', 'module:marketing:view', 'activity:view:all'] },
  { email: 'customercare@alumni.com', password: 'Alumni@2024', name: 'Atendimento', cargo: 'Coordenador de Atendimento', role: 'Customer Care', permissions: ['module:overview:view', 'module:customer-care:view', 'module:cancelamentos:view', 'module:cobranca:view', 'activity:view:own'] },
  { email: 'marketing@alumni.com', password: 'Alumni@2024', name: 'Marketing', cargo: 'Gerente de Marketing', role: 'Marketing', permissions: ['module:overview:view', 'module:marketing:view', 'activity:view:own'] },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar modo demo (trim para lidar com possíveis espaços/newlines)
    const demoModeEnabled = process.env.ENABLE_DEMO_MODE?.trim() === 'true';

    // Tentar autenticar com demo users primeiro (fallback)
    if (demoModeEnabled) {
      const demoUser = DEMO_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (demoUser) {
        // Usar permissões do demo user diretamente (sem acesso ao banco)
        const token = await signToken({
          userId: `demo-${demoUser.email}`,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          permissions: demoUser.permissions,
        });

        await setAuthCookie(token);

        return NextResponse.json({
          success: true,
          user: {
            id: `demo-${demoUser.email}`,
            email: demoUser.email,
            name: demoUser.name,
            cargo: demoUser.cargo,
            role: demoUser.role,
          },
        });
      }
    }

    // Tentar autenticar com banco de dados (lazy load)
    try {
      const { prisma } = await import('@/lib/db/prisma');
      const { verifyPassword } = await import('@/lib/auth/password');

      const user = await prisma.user.findUnique({
        where: { email },
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
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Usuário desativado. Entre em contato com o administrador.' },
          { status: 403 }
        );
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);

      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      // Extrair permissões do role
      const permissions = user.role.permissions.map(rp => rp.permission.code);

      // Criar token JWT
      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions,
      });

      // Setar cookie httpOnly
      await setAuthCookie(token);

      // Registrar login no ActivityLog (não bloqueia login se falhar)
      prisma.activityLog.create({
        data: {
          type: 'USER_LOGIN',
          description: `Usuário ${user.name} fez login`,
          metadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
          },
          userId: user.id,
        }
      }).catch(err => {
        console.error('Erro ao registrar login no ActivityLog:', err);
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          cargo: user.cargo,
          role: user.role.name,
        },
      });

    } catch (dbError) {
      // Se o banco não estiver disponível e modo demo está ativo
      if (demoModeEnabled) {
        console.error('Erro ao conectar ao banco, modo demo não encontrou usuário:', dbError);
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      throw dbError;
    }

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
