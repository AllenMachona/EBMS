const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');
const { canTransition } = require('../utils/statusMachine');

// FR-INIT-001: unique tender number using a configurable numbering convention.
function generateTenderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PE/${year}/${rand}`;
}

async function createProcurement(req, res, next) {
  try {
    const { title, category, method, envelopeType, estimatedValue, fundingSource } = req.body;
    if (!title || !category || !method || !estimatedValue) {
      return res.status(400).json({ error: 'title, category, method and estimatedValue are required.' });
    }

    const procurement = await prisma.procurement.create({
      data: {
        tenderNumber: generateTenderNumber(),
        title,
        category,
        method,
        envelopeType: envelopeType || 'SINGLE',
        estimatedValue,
        fundingSource,
        createdById: req.user.id,
      },
    });

    await logAudit({
      req, action: 'PROCUREMENT_CREATED', entityType: 'Procurement', entityId: procurement.id,
      newValue: procurement,
    });

    res.status(201).json(procurement);
  } catch (err) {
    next(err);
  }
}

async function listProcurements(req, res, next) {
  try {
    // Bidders only ever see published-or-later procurements (never DRAFT/INTERNAL_REVIEW).
    const where = req.user.role === 'BIDDER'
      ? { status: { notIn: ['DRAFT', 'INTERNAL_REVIEW', 'APPROVED_FOR_PUBLICATION'] } }
      : {};
    const procurements = await prisma.procurement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(procurements);
  } catch (err) {
    next(err);
  }
}

async function getProcurement(req, res, next) {
  try {
    const procurement = await prisma.procurement.findUnique({
      where: { id: req.params.id },
      include: { documents: true, communications: true },
    });
    if (!procurement) return res.status(404).json({ error: 'Procurement not found.' });

    if (req.user.role === 'BIDDER' && ['DRAFT', 'INTERNAL_REVIEW', 'APPROVED_FOR_PUBLICATION'].includes(procurement.status)) {
      return res.status(404).json({ error: 'Procurement not found.' });
    }
    res.json(procurement);
  } catch (err) {
    next(err);
  }
}

// Generic, audited status transition endpoint. All stage-specific business
// rules (quorum, cooling-off, complaint holds, etc.) are additionally
// enforced in their own dedicated routes — this endpoint only enforces
// that the transition itself is a legal move in the lifecycle graph.
async function transitionStatus(req, res, next) {
  try {
    const { to, reason } = req.body;
    const procurement = await prisma.procurement.findUnique({ where: { id: req.params.id } });
    if (!procurement) return res.status(404).json({ error: 'Procurement not found.' });

    if (!canTransition(procurement.status, to)) {
      return res.status(400).json({
        error: `Cannot move from ${procurement.status} to ${to}.`,
      });
    }

    const updated = await prisma.procurement.update({
      where: { id: procurement.id },
      data: { status: to },
    });

    await logAudit({
      req, action: 'PROCUREMENT_STATUS_CHANGED', entityType: 'Procurement', entityId: procurement.id,
      previousValue: { status: procurement.status }, newValue: { status: to }, reason,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createProcurement, listProcurements, getProcurement, transitionStatus };
