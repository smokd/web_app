'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function getAuditLogs() {
  await requireAdmin();

  return prisma.auditLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 500,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
