const fs = require('fs');
const prisma = require('../config/db');
const { decryptBuffer } = require('../utils/encryption');
const { logAudit } = require('../middleware/audit');

// Step 1 of opening: a panel member confirms presence/attendance for a
// given envelope type. This does NOT decrypt anything by itself.
async function confirmPresence(req, res, next) {
  try {
    const { procurementId, envelopeType } = req.body;
    const confirmation = await prisma.openingConfirmation.upsert({
      where: { procurementId_userId_envelopeType: { procurementId, userId: req.user.id, envelopeType } },
      update: {},
      create: { procurementId, userId: req.user.id, envelopeType },
    });
    await logAudit({
      req, action: 'OPENING_PRESENCE_CONFIRMED', entityType: 'Procurement', entityId: procurementId,
      newValue: { envelopeType, panelMember: req.user.id },
    });
    res.status(201).json(confirmation);
  } catch (err) {
    next(err);
  }
}

async function quorumStatus(req, res, next) {
  try {
    const { procurementId, envelopeType } = req.params;
    const confirmations = await prisma.openingConfirmation.findMany({
      where: { procurementId, envelopeType },
      include: { user: { select: { name: true, role: true } } },
    });
    const quorum = parseInt(process.env.OPENING_QUORUM || '2', 10);
    res.json({
      required: quorum,
      confirmed: confirmations.length,
      met: confirmations.length >= quorum,
      confirmedBy: confirmations.map((c) => ({ name: c.user.name, at: c.confirmedAt })),
    });
  } catch (err) {
    next(err);
  }
}

// Step 2: only reachable once middleware/openingQuorum has verified quorum.
// For dual-envelope procedures, FINANCIAL may only be opened once the
// procurement has passed TECHNICAL_OUTCOME_APPROVED (enforced below),
// matching FR-OPEN-005 / FR-EVAL-006.
async function openEnvelope(req, res, next) {
  try {
    const { procurementId, envelopeType } = req.body;
    const procurement = await prisma.procurement.findUnique({ where: { id: procurementId } });
    if (!procurement) return res.status(404).json({ error: 'Procurement not found.' });

    if (envelopeType === 'FINANCIAL' && procurement.envelopeType === 'FINANCIAL' &&
        procurement.status !== 'TECHNICAL_OUTCOME_APPROVED' && procurement.status !== 'FINANCIAL_OPENING') {
      return res.status(403).json({ error: 'Financial envelope cannot be opened before technical outcome approval.' });
    }

    const submissions = await prisma.submission.findMany({
      where: { procurementId, envelopeType, status: 'SUBMITTED' },
      include: { bidder: { select: { companyName: true } } },
    });

    const openedRecord = submissions.map((s) => {
      const plaintext = decryptBuffer(fs.readFileSync(s.filePath));
      // We deliberately do NOT return raw file bytes over the API here —
      // only confirm integrity and produce the statutory opening record
      // (Form G/H/I). A separate authenticated download route would be
      // added for the actual evaluation-stage file retrieval in a full build.
      return {
        bidder: s.bidder.companyName,
        submissionId: s.id,
        receiptCode: s.receiptCode,
        submittedAt: s.submittedAt,
        integrityVerifiedBytes: plaintext.length,
      };
    });

    await logAudit({
      req, action: 'ENVELOPE_OPENED', entityType: 'Procurement', entityId: procurementId,
      newValue: { envelopeType, bidderCount: openedRecord.length },
    });

    res.json({
      procurementId,
      envelopeType,
      openedAt: new Date().toISOString(),
      openedBy: req.user.name,
      record: openedRecord,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { confirmPresence, quorumStatus, openEnvelope };
