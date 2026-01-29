import { PrismaClient, ActivityType } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import ws from 'ws';

// Configurar WebSocket para Node.js (seed roda em Node)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não está configurada');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

// Definicao de todas as permissoes do sistema
const PERMISSIONS = [
  // Modulos - View
  { code: 'module:overview:view', name: 'Ver Visao Geral', category: 'module' },
  { code: 'module:vendas-b2c:view', name: 'Ver Vendas B2C', category: 'module' },
  { code: 'module:vendas-b2b:view', name: 'Ver Vendas B2B', category: 'module' },
  { code: 'module:customer-care:view', name: 'Ver Customer Care', category: 'module' },
  { code: 'module:cancelamentos:view', name: 'Ver Cancelamentos', category: 'module' },
  { code: 'module:cobranca:view', name: 'Ver Cobranca', category: 'module' },
  { code: 'module:alunos-ativos:view', name: 'Ver Alunos Ativos', category: 'module' },
  { code: 'module:marketing:view', name: 'Ver Marketing', category: 'module' },

  // Admin
  { code: 'admin:users:view', name: 'Ver Usuarios', category: 'admin' },
  { code: 'admin:users:create', name: 'Criar Usuarios', category: 'admin' },
  { code: 'admin:users:edit', name: 'Editar Usuarios', category: 'admin' },
  { code: 'admin:users:delete', name: 'Deletar Usuarios', category: 'admin' },
  { code: 'admin:config:view', name: 'Ver Configuracoes', category: 'admin' },
  { code: 'admin:config:edit', name: 'Editar Configuracoes', category: 'admin' },

  // Atividades
  { code: 'activity:view:all', name: 'Ver Todas Atividades', category: 'activity' },
  { code: 'activity:view:own', name: 'Ver Atividades Proprias', category: 'activity' },
];

// Roles e suas permissoes
const ROLES = [
  {
    name: 'ADM',
    displayName: 'Administrador',
    description: 'Acesso total ao sistema, gestao de usuarios e configuracoes',
    isSystem: true,
    permissions: PERMISSIONS.map(p => p.code), // Todas as permissoes
  },
  {
    name: 'Investidor',
    displayName: 'Investidor',
    description: 'Visualiza todas as dashboards e atividades',
    isSystem: true,
    permissions: [
      'module:overview:view',
      'module:vendas-b2c:view',
      'module:vendas-b2b:view',
      'module:customer-care:view',
      'module:cancelamentos:view',
      'module:cobranca:view',
      'module:alunos-ativos:view',
      'module:marketing:view',
      'activity:view:all',
    ],
  },
  {
    name: 'Customer Care',
    displayName: 'Customer Care',
    description: 'Acesso a Customer Care, Cancelamentos e Cobranca',
    isSystem: true,
    permissions: [
      'module:overview:view',
      'module:customer-care:view',
      'module:cancelamentos:view',
      'module:cobranca:view',
      'activity:view:own',
    ],
  },
  {
    name: 'Marketing',
    displayName: 'Marketing',
    description: 'Acesso ao modulo de Marketing',
    isSystem: true,
    permissions: [
      'module:overview:view',
      'module:marketing:view',
      'activity:view:own',
    ],
  },
];

// Demo users que serao migrados do sistema antigo
const DEMO_USERS = [
  {
    email: 'investidor@alumni.com',
    password: 'Alumni@2024',
    name: 'Investidor',
    cargo: 'Investidor',
    roleName: 'Investidor',
    isDemoUser: true,
  },
  {
    email: 'ceo@alumni.com',
    password: 'Alumni@2024',
    name: 'CEO',
    cargo: 'CEO',
    roleName: 'ADM',
    isDemoUser: true,
  },
  {
    email: 'viewer@alumni.com',
    password: 'Alumni@2024',
    name: 'Visualizador',
    cargo: 'Analista',
    roleName: 'Investidor',
    isDemoUser: true,
  },
  // Usuarios adicionais para demo de cada role
  {
    email: 'adm@alumni.com',
    password: 'Alumni@2024',
    name: 'Administrador',
    cargo: 'Diretor de TI',
    roleName: 'ADM',
    isDemoUser: true,
  },
  {
    email: 'customercare@alumni.com',
    password: 'Alumni@2024',
    name: 'Atendimento',
    cargo: 'Coordenador de Atendimento',
    roleName: 'Customer Care',
    isDemoUser: true,
  },
  {
    email: 'marketing@alumni.com',
    password: 'Alumni@2024',
    name: 'Marketing',
    cargo: 'Gerente de Marketing',
    roleName: 'Marketing',
    isDemoUser: true,
  },
];

async function main() {
  console.log('Iniciando seed do banco de dados...\n');

  // 1. Criar permissoes
  console.log('Criando permissoes...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category },
      create: perm,
    });
  }
  console.log(`  ${PERMISSIONS.length} permissoes criadas/atualizadas\n`);

  // 2. Criar roles
  console.log('Criando roles...');
  for (const roleData of ROLES) {
    const { permissions, ...roleInfo } = roleData;

    // Cria ou atualiza o role
    const role = await prisma.role.upsert({
      where: { name: roleInfo.name },
      update: {
        displayName: roleInfo.displayName,
        description: roleInfo.description,
      },
      create: roleInfo,
    });

    // Busca as permissoes pelo codigo
    const permissionRecords = await prisma.permission.findMany({
      where: { code: { in: permissions } },
    });

    // Remove permissoes antigas e adiciona novas
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    await prisma.rolePermission.createMany({
      data: permissionRecords.map(p => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });

    console.log(`  Role "${role.name}" com ${permissions.length} permissoes`);
  }
  console.log('');

  // 3. Criar usuarios demo
  console.log('Criando usuarios demo...');
  for (const userData of DEMO_USERS) {
    const role = await prisma.role.findUnique({
      where: { name: userData.roleName },
    });

    if (!role) {
      console.log(`  ERRO: Role "${userData.roleName}" nao encontrado para ${userData.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        cargo: userData.cargo,
        roleId: role.id,
        passwordHash,
      },
      create: {
        email: userData.email,
        passwordHash,
        name: userData.name,
        cargo: userData.cargo,
        roleId: role.id,
        isDemoUser: userData.isDemoUser,
        isActive: true,
      },
    });

    console.log(`  Usuario "${userData.email}" (${userData.roleName})`);
  }
  console.log('');

  // 4. Criar snapshots iniciais para os modulos
  console.log('Criando snapshots iniciais dos modulos...');
  const modules = [
    'vendas_b2c',
    'vendas_b2b',
    'customer_care',
    'cancelamentos',
    'cobranca',
    'alunos_ativos',
    'marketing',
  ];

  for (const moduleId of modules) {
    await prisma.moduleDataSnapshot.upsert({
      where: { moduleId },
      update: {},
      create: {
        moduleId,
        contentHash: 'initial',
        rowCount: 0,
        lastModified: new Date(),
      },
    });
    console.log(`  Snapshot para "${moduleId}"`);
  }
  console.log('');

  // 5. Registrar atividade do seed
  await prisma.activityLog.create({
    data: {
      type: ActivityType.CONFIG_CHANGED,
      description: 'Banco de dados inicializado com seed',
      metadata: {
        roles: ROLES.map(r => r.name),
        users: DEMO_USERS.map(u => u.email),
        modules,
      },
    },
  });

  console.log('Seed concluido com sucesso!');
  console.log('---');
  console.log('Usuarios demo disponiveis:');
  DEMO_USERS.forEach(u => {
    console.log(`  ${u.email} / ${u.password} (${u.roleName})`);
  });
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
