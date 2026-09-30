// lib/audit.ts — best-effort audit logging for admin actions.
// Never throws: audit is observability, not control — it must not break
// the action it records. But a failed audit write must NEVER vanish
// silently (that is how a topic delete once went unidentified): on DB
// failure we fall back to a local append-only log file + stderr.
import { promises as fs } from "fs";
import { prisma } from "@/lib/db";

export interface AuditOpts {
  actorId?: number | null;
  actorEmail?: string | null;
  entityType?: string;
  entityId?: string | number;
  detail?: unknown;
  ip?: string;
}

export async function auditLog(
  action: string,
  opts?: AuditOpts
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId: opts?.actorId ?? null,
        actorEmail: opts?.actorEmail ?? null,
        entityType: opts?.entityType,
        entityId:
          opts?.entityId != null ? String(opts.entityId) : undefined,
        detail:
          opts?.detail !== undefined
            ? JSON.stringify(opts.detail)
            : undefined,
        ip: opts?.ip,
      },
    });
  } catch (err) {
    // Fallback trail: the action already succeeded, so persist the record
    // to a local file instead of losing it. Security-relevant actions
    // (deletes, bans, role changes) must always leave a trace somewhere.
    try {
      await fs.mkdir("logs", { recursive: true });
      const line =
        JSON.stringify({
          ts: new Date().toISOString(),
          action,
          actorId: opts?.actorId ?? null,
          actorEmail: opts?.actorEmail ?? null,
          entityType: opts?.entityType ?? null,
          entityId: opts?.entityId != null ? String(opts.entityId) : null,
          detail: opts?.detail !== undefined ? opts.detail : null,
          ip: opts?.ip ?? null,
          fallbackReason: "auditLog DB write failed",
        }) + "\n";
      await fs.appendFile("logs/audit-fallback.log", line);
    } catch {
      // last resort: nothing more we can do without breaking the action
    }
    console.error(`[audit] DB write failed for action "${action}" — wrote fallback log.`, err);
  }
}
