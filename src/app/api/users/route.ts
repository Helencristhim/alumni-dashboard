import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser, hasPermission as checkPermission } from '@/lib/auth/jwt';
import { hashPassword, validatePassword, generateRandomPassword } from '@/lib/auth/password';

// GET - Lista todos os usuarios
export async function GET(request: NextRequest) {
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

    // Parametros de busca
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';

    // Construir filtro
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) {
      where.role = { name: roleFilter };
    }

    if (statusFilter === 'active') {
      where.isActive = true;
    } else if (statusFilter === 'inactive') {
      where.isActive = false;
    }

    // Buscar usuarios
    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remover senha dos resultados
    const safeUsers = users.map(({ passwordHash: _, ...user }) => user);

    return NextResponse.json({ users: safeUsers });

  } catch (error) {
    console.error('Erro ao listar usuarios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuario
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, email, cargo, roleId, password, generatePassword } = body;

    // Validacoes
    if (!name || !email || !cargo || !roleId) {
      return NextResponse.json(
        { error: 'Nome, email, cargo e role sao obrigatorios' },
        { status: 400 }
      );
    }

    // Verificar se email ja existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ja cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se role existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role nao encontrada' },
        { status: 400 }
      );
    }

    // Gerar ou validar senha
    let finalPassword = password;
    if (generatePassword || !password) {
      finalPassword = generateRandomPassword();
    } else {
      const validation = validatePassword(password);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    // Criar usuario
    const passwordHash = await hashPassword(finalPassword);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        cargo,
        roleId,
        passwordHash,
        isActive: true,
        isDemoUser: false,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          }
        }
      }
    });

    // Registrar atividade (não bloqueia a operação principal)
    const isDemoUser = authUser.userId.startsWith('demo-');
    prisma.activityLog.create({
      data: {
        type: 'USER_CREATED',
        description: `Usuario ${newUser.name} criado por ${authUser.name}`,
        metadata: {
          createdUserId: newUser.id,
          createdUserEmail: newUser.email,
          roleId: newUser.roleId,
        },
        userId: isDemoUser ? null : authUser.userId,
      }
    }).catch(err => console.error('Erro ao registrar atividade:', err));

    // Remover senha do retorno
    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      generatedPassword: generatePassword || !password ? finalPassword : undefined,
    });

  } catch (error) {
    console.error('Erro ao criar usuario:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
