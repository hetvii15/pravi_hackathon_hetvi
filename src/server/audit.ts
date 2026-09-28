import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

export type AuditLogInput = {
  userId?: string | null;
  assetId?: string | null;
  action: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
};

// Single place every mutation routes through to record who changed what.
// Always call this via the same `tx` used for the rest of the mutation so
// the audit entry is atomic with the change it's describing.
export async function createAuditLog(tx: TxClient, input: AuditLogInput) {
  return tx.auditLog.create({
    data: {
      userId: input.userId ?? null,
      assetId: input.assetId ?? null,
      action: input.action,
      fieldChanged: input.fieldChanged ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
    },
  });
}

// Compares two plain field maps and writes one audit row per changed field.
// Used by asset update so every meaningful change is individually traceable.
export async function auditFieldDiffs(
  tx: TxClient,
  params: {
    userId?: string | null;
    assetId: string;
    action: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    fields: string[];
  }
) {
  const { userId, assetId, action, before, after, fields } = params;
  const changed = fields.filter((f) => stringify(before[f]) !== stringify(after[f]));
  if (changed.length === 0) return [];

  return Promise.all(
    changed.map((field) =>
      createAuditLog(tx, {
        userId,
        assetId,
        action,
        fieldChanged: field,
        oldValue: stringify(before[field]),
        newValue: stringify(after[field]),
      })
    )
  );
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
