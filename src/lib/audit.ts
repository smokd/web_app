import prisma from '@/lib/prisma';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditEntity =
  | 'HARVEST'
  | 'PACKHOUSE_LOAD'
  | 'PACKHOUSE_REJECT'
  | 'SHELF_LIFE_SAMPLE'
  | 'SHELF_LIFE_OBSERVATION'
  | 'USER';

type AuditInput = {
  userId?: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | number | null;
  description?: string;
  changes?: unknown;
};

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  description,
  changes,
}: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:
          userId ?? null,

        action,

        entity,

        entityId:
          entityId === null ||
          entityId === undefined
            ? null
            : String(entityId),

        description:
          description ?? null,

        changes:
          changes === undefined
            ? null
            : JSON.stringify(changes),
      },
    });
  } catch (error) {
    /*
     * Audit logging must never
     * break the actual operation.
     *
     * Log the failure so it can
     * be investigated.
     */
    console.error(
      'AUDIT LOG FAILED:',
      error
    );
  }
}
