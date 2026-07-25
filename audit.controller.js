const prisma = require('../config/db');

// 9.3: read-only, case-scoped access for oversight roles. There is
// deliberately no PUT/PATCH/DELETE route anywhere in this file or the
// corresponding routes file — the audit log is append-only by design.
async function listAuditLogs(req, res, next) {
  try {
    const { entityType, entityId, userId } = req.query;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'AUDIT_LOG_ACCESSED', entityType: 'AuditLog', ipAddress: req.ip },
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLogs };
