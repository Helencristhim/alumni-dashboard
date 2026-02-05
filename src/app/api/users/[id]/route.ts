import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser, hasPermission as checkPermission } from '@/lib/auth/jwt';
import { hashPassword, validatePassword, generateRandomPassword } from '@/lib/auth/password';

type RouteParams = { params: Promise<{ id: string }> };

// GET - Obter usuario por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar autenticacao
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Verificar permissao (pode ver proprio perfil ou ser admin)
    if (authUser.userId !== id && !checkPermission(authUser, 'admin:users:manage')) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Remover senha
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error('Erro ao obter usuario:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuario
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
    const { name, email, cargo, roleId, isActive, resetPassword, newPassword } = body;

    // Verificar se usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Se mudando email, verificar se ja existe
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email ja em uso' }, { status: 400 });
      }
    }

    // Se mudando role, verificar se existe
    if (roleId && roleId !== existingUser.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!role) {
        return NextResponse.json({ error: 'Role nao encontrada' }, { status: 400 });
      }
    }

    // Preparar dados de atualizacao
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (cargo) updateData.cargo = cargo;
    if (roleId) updateData.roleId = roleId;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Gerar nova senha se solicitado
    let generatedPassword: string | undefined;
    if (resetPassword) {
      generatedPassword = generateRandomPassword();
      updateData.passwordHash = await hashPassword(generatedPassword);
    } else if (newPassword) {
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    // Atualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Registrar atividade
    const changes: string[] = [];
    if (name && name !== existingUser.name) changes.push('nome');
    if (email && email !== existingUser.email) changes.push('email');
    if (cargo && cargo !== existingUser.cargo) changes.push('cargo');
    if (roleId && roleId !== existingUser.roleId) changes.push('role');
    if (typeof isActive === 'boolean' && isActive !== existingUser.isActive) {
      changes.push(isActive ? 'ativado' : 'desativado');
    }
    if (resetPassword || newPassword) changes.push('senha');

    if (changes.length > 0) {
      const isDemoUser = authUser.userId.startsWith('demo-');
      prisma.activityLog.create({
        data: {
          type: roleId !== existingUser.roleId ? 'ROLE_CHANGED' : 'USER_UPDATED',
          description: `Usuario ${updatedUser.name} atualizado: ${changes.join(', ')}`,
          metadata: {
            updatedUserId: updatedUser.id,
            changes,
            previousRole: existingUser.role.name,
            newRole: updatedUser.role.name,
          },
          userId: isDemoUser ? null : authUser.userId,
        }
      }).catch(err => console.error('Erro ao registrar atividade:', err));
    }

    // Remover senha do retorno
    const { passwordHash: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      generatedPassword,
    });

  } catch (error) {
    console.error('Erro ao atualizar usuario:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir usuario (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verificar autenticacao
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Verificar permissao
    if (!checkPermission(authUser, 'admin:users:manage')) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    // Nao pode excluir a si mesmo
    if (authUser.userId === id) {
      return NextResponse.json(
        { error: 'Nao pode excluir seu proprio usuario' },
        { status: 400 }
      );
    }

    // Verificar se usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Soft delete - apenas desativa
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Registrar atividade (não bloqueia a operação principal)
    const isDemoUser = authUser.userId.startsWith('demo-');
    prisma.activityLog.create({
      data: {
        type: 'USER_DELETED',
        description: `Usuario ${existingUser.name} desativado por ${authUser.name}`,
        metadata: {
          deletedUserId: existingUser.id,
          deletedUserEmail: existingUser.email,
        },
        userId: isDemoUser ? null : authUser.userId,
      }
    }).catch(err => console.error('Erro ao registrar atividade:', err));

    return NextResponse.json({
      success: true,
      message: 'Usuario desativado com sucesso',
    });

  } catch (error) {
    console.error('Erro ao excluir usuario:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
