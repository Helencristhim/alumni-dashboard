import { prisma } from '@/lib/db/prisma';
import { logDataChange } from './logger';

/**
 * Calcula hash SHA-256 de uma string
 */
export async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Informacoes dos modulos
 */
export const MODULE_INFO: Record<
  string,
  { name: string; sheetId?: string; sheetRange?: string }
> = {
  'vendas-b2c': {
    name: 'Vendas B2C',
    sheetId: process.env.GOOGLE_SHEET_ID_VENDAS_B2C,
    sheetRange: 'A:Z',
  },
  'vendas-b2b': {
    name: 'Vendas B2B',
    sheetId: process.env.GOOGLE_SHEET_ID_VENDAS_B2B,
    sheetRange: 'A:Z',
  },
  'customer-care': {
    name: 'Customer Care',
    sheetId: process.env.GOOGLE_SHEET_ID_CUSTOMER_CARE,
    sheetRange: 'A:Z',
  },
  cancelamentos: {
    name: 'Cancelamentos',
    sheetId: process.env.GOOGLE_SHEET_ID_CANCELAMENTOS,
    sheetRange: 'A:Z',
  },
  cobranca: {
    name: 'Cobranca',
    sheetId: process.env.GOOGLE_SHEET_ID_COBRANCA,
    sheetRange: 'A:Z',
  },
  'alunos-ativos': {
    name: 'Alunos Ativos',
    sheetId: process.env.GOOGLE_SHEET_ID_ALUNOS_ATIVOS,
    sheetRange: 'A:Z',
  },
  marketing: {
    name: 'Marketing',
    sheetId: process.env.GOOGLE_SHEET_ID_MARKETING,
    sheetRange: 'A:Z',
  },
};

/**
 * Obtem ou cria snapshot de um modulo
 */
export async function getModuleSnapshot(moduleId: string) {
  let snapshot = await prisma.moduleDataSnapshot.findUnique({
    where: { moduleId },
  });

  if (!snapshot) {
    snapshot = await prisma.moduleDataSnapshot.create({
      data: {
        moduleId,
        contentHash: '',
        rowCount: 0,
      },
    });
  }

  return snapshot;
}

/**
 * Atualiza snapshot de um modulo
 */
export async function updateModuleSnapshot(
  moduleId: string,
  contentHash: string,
  rowCount: number
) {
  return prisma.moduleDataSnapshot.upsert({
    where: { moduleId },
    update: {
      contentHash,
      rowCount,
      lastModified: new Date(),
    },
    create: {
      moduleId,
      contentHash,
      rowCount,
    },
  });
}

/**
 * Verifica se houve mudanca nos dados de um modulo
 */
export async function checkModuleDataChange(
  moduleId: string,
  newData: unknown[][]
): Promise<{
  changed: boolean;
  previousHash: string;
  newHash: string;
  rowCount: number;
}> {
  // Calcular hash do novo conteudo
  const contentString = JSON.stringify(newData);
  const newHash = await calculateHash(contentString);
  const rowCount = newData.length;

  // Obter snapshot anterior
  const snapshot = await getModuleSnapshot(moduleId);
  const previousHash = snapshot.contentHash;

  // Verificar se mudou
  const changed = previousHash !== newHash;

  if (changed) {
    // Atualizar snapshot
    await updateModuleSnapshot(moduleId, newHash, rowCount);

    // Registrar atividade
    const moduleInfo = MODULE_INFO[moduleId];
    await logDataChange(moduleId, moduleInfo?.name || moduleId, 'updated', {
      previousHash,
      newHash,
      rowCount,
    });
  }

  return {
    changed,
    previousHash,
    newHash,
    rowCount,
  };
}

/**
 * Obtem status de todos os modulos
 */
export async function getAllModulesStatus() {
  const modules = Object.keys(MODULE_INFO);

  const snapshots = await prisma.moduleDataSnapshot.findMany({
    where: {
      moduleId: { in: modules },
    },
  });

  const snapshotMap = new Map(snapshots.map((s) => [s.moduleId, s]));

  // Buscar ultima atividade de cada modulo
  const lastActivities = await prisma.activityLog.findMany({
    where: {
      moduleId: { in: modules },
      type: { in: ['DATA_UPDATED', 'DATA_NO_CHANGE'] },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['moduleId'],
  });

  const activityMap = new Map(lastActivities.map((a) => [a.moduleId, a]));

  return modules.map((moduleId) => {
    const info = MODULE_INFO[moduleId];
    const snapshot = snapshotMap.get(moduleId);
    const lastActivity = activityMap.get(moduleId);

    // Verificar se houve atualizacao hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastUpdate = snapshot?.lastModified;
    const updatedToday = lastUpdate && lastUpdate >= today;

    return {
      moduleId,
      name: info.name,
      lastModified: lastUpdate,
      rowCount: snapshot?.rowCount || 0,
      status: updatedToday ? 'updated' : 'no_update',
      lastActivityType: lastActivity?.type,
      lastActivityDate: lastActivity?.createdAt,
    };
  });
}

/**
 * Registra execucao de tarefa agendada
 */
export async function recordScheduledTaskRun(
  taskName: string,
  status: 'success' | 'error',
  result?: string
) {
  return prisma.scheduledTaskRun.create({
    data: {
      taskName,
      status,
      result,
      completedAt: new Date(),
    },
  });
}

/**
 * Obtem ultima execucao de uma tarefa
 */
export async function getLastTaskRun(taskName: string) {
  return prisma.scheduledTaskRun.findFirst({
    where: { taskName },
    orderBy: { startedAt: 'desc' },
  });
}
