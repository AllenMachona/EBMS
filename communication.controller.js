const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');

// SOAR 7.6: questions, clarifications and addenda all flow through this
// single official channel — direct evaluator/procurement-officer-to-bidder
// contact outside this record does not count as part of the process.
async function postCommunication(req, res, next) {
  try {
    const { procurementId, type, content, isPublic } = req.body;
    if (!procurementId || !type || !content) {
      return res.status(400).json({ error: 'procurementId, type and content are required.' });
    }
    const comm = await prisma.communication.create({
      data: {
        procurementId,
        type,
        content,
        fromUserId: req.user.role === 'BIDDER' ? null : req.user.id,
        isPublic: isPublic !== false,
      },
    });

    await logAudit({ req, action: 'COMMUNICATION_POSTED', entityType: 'Communication', entityId: comm.id, newValue: comm });
    res.status(201).json(comm);
  } catch (err) {
    next(err);
  }
}

async function listCommunications(req, res, next) {
  try {
    const comms = await prisma.communication.findMany({
      where: { procurementId: req.params.procurementId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comms);
  } catch (err) {
    next(err);
  }
}

module.exports = { postCommunication, listCommunications };
