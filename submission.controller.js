const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { encryptBuffer, sha256, generateReceiptCode } = require('../utils/encryption');
const { logAudit } = require('../middleware/audit');

// FR-SUB (7.7): a bidder submits into its own sealed workspace only.
// The file is encrypted at rest before it ever touches disk. Nobody —
// including a Procurement Unit or System Administrator user — has a read
// route that returns plaintext before the opening quorum is met
// (see routes/opening.routes.js).
async function submitBid(req, res, next) {
  try {
    const { procurementId, envelopeType } = req.body;
    const bidderId = req.user.bidderId; // set/enforced by bidderIsolation middleware
    if (!req.file) return res.status(400).json({ error: 'A file is required.' });

    const procurement = await prisma.procurement.findUnique({ where: { id: procurementId } });
    if (!procurement) return res.status(404).json({ error: 'Procurement not found.' });

    if (procurement.status !== 'SUBMISSION_OPEN') {
      return res.status(403).json({ error: 'Submissions are not currently open for this procurement.' });
    }
    if (procurement.closingAt && new Date() > new Date(procurement.closingAt)) {
      // Record the late attempt without exposing content, then reject (FR: late-submission control).
      await logAudit({
        req, action: 'LATE_SUBMISSION_REJECTED', entityType: 'Procurement', entityId: procurement.id,
        reason: `Attempted submission after closing time ${procurement.closingAt}`,
      });
      return res.status(403).json({ error: 'Submission closing time has passed. This attempt has been logged.' });
    }

    const plainHash = sha256(req.file.buffer);
    const sealed = encryptBuffer(req.file.buffer);
    const storedName = `${Date.now()}-${bidderId}-${envelopeType}.sealed`;
    const storedPath = path.join(__dirname, '..', 'uploads', storedName);
    fs.writeFileSync(storedPath, sealed);

    // Mark any previous submission of the same envelope type by this bidder as REPLACED.
    await prisma.submission.updateMany({
      where: { procurementId, bidderId, envelopeType, status: 'SUBMITTED' },
      data: { status: 'REPLACED' },
    });

    const priorCount = await prisma.submission.count({ where: { procurementId, bidderId, envelopeType } });

    const submission = await prisma.submission.create({
      data: {
        procurementId,
        bidderId,
        envelopeType,
        filePath: storedPath,
        sha256Hash: plainHash,
        version: priorCount + 1,
        submittedById: req.user.id,
        receiptCode: generateReceiptCode(),
      },
    });

    await logAudit({
      req, action: 'BID_SUBMITTED', entityType: 'Submission', entityId: submission.id,
      newValue: { procurementId, bidderId, envelopeType, hash: plainHash, receiptCode: submission.receiptCode },
    });

    // Never return the plaintext hash comparison path or file path to the client beyond the receipt.
    res.status(201).json({
      receiptCode: submission.receiptCode,
      submittedAt: submission.submittedAt,
      envelopeType: submission.envelopeType,
      version: submission.version,
    });
  } catch (err) {
    next(err);
  }
}

async function withdrawSubmission(req, res, next) {
  try {
    const bidderId = req.user.bidderId;
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission || submission.bidderId !== bidderId) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    const procurement = await prisma.procurement.findUnique({ where: { id: submission.procurementId } });
    if (procurement.status !== 'SUBMISSION_OPEN') {
      return res.status(403).json({ error: 'Withdrawal is only permitted before closing.' });
    }
    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: { status: 'WITHDRAWN' },
    });
    await logAudit({ req, action: 'BID_WITHDRAWN', entityType: 'Submission', entityId: submission.id });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Returns only metadata — never file content — and only for the bidder's own submissions.
async function myBidderSubmissions(req, res, next) {
  try {
    const submissions = await prisma.submission.findMany({
      where: { bidderId: req.user.bidderId, procurementId: req.params.procurementId },
      select: {
        id: true, envelopeType: true, version: true, status: true, submittedAt: true, receiptCode: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    next(err);
  }
}

// For Procurement Unit / opening panel: shows who submitted, never bid content.
async function submissionRegister(req, res, next) {
  try {
    const submissions = await prisma.submission.findMany({
      where: { procurementId: req.params.procurementId },
      include: { bidder: { select: { companyName: true, registrationNumber: true } } },
      orderBy: { submittedAt: 'asc' },
    });
    const redacted = submissions.map((s) => ({
      id: s.id,
      bidder: s.bidder.companyName,
      envelopeType: s.envelopeType,
      version: s.version,
      status: s.status,
      submittedAt: s.submittedAt,
      receiptCode: s.receiptCode,
    }));
    res.json(redacted);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitBid, withdrawSubmission, myBidderSubmissions, submissionRegister };
