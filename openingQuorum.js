const prisma = require('../config/db');

// Enforces FR-OPEN-003/004: no single user may decrypt a sealed envelope.
// A configurable number of DISTINCT opening-panel members must each submit
// a confirmation (see routes/opening.routes.js) before decryption unlocks.
async function requireOpeningQuorum(req, res, next) {
  try {
    const { procurementId, envelopeType } = req.body;
    const quorum = parseInt(process.env.OPENING_QUORUM || '2', 10);

    const confirmations = await prisma.openingConfirmation.findMany({
      where: { procurementId, envelopeType },
    });

    const distinctUsers = new Set(confirmations.map((c) => c.userId));
    if (distinctUsers.size < quorum) {
      return res.status(403).json({
        error: `Opening quorum not met: ${distinctUsers.size}/${quorum} panel members have confirmed.`,
        confirmedCount: distinctUsers.size,
        required: quorum,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireOpeningQuorum };
