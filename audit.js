const prisma = require('../config/db');

// Writes an immutable audit event (SOAR 8.3). No route in this system
// ever updates or deletes an AuditLog row.
async function logAudit({ req, action, entityType, entityId, previousValue, newValue, reason }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user ? req.user.id : null,
        action,
        entityType,
        entityId: entityId || null,
        previousValue: previousValue ?? undefined,
        newValue: newValue ?? undefined,
        ipAddress: req.ip,
        reason: reason || null,
      },
    });
  } catch (err) {
    // Audit failures must never silently disappear — log to stderr at minimum.
    console.error('AUDIT LOG FAILURE:', err);
  }
}

module.exports = { logAudit };
