const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');

// FR-AWD-001/005: creates the award and starts the statutory cooling-off
// period. Publishing is a distinct, explicit action from recommendation.
async function createAward(req, res, next) {
  try {
    const { procurementId, winningBidderId } = req.body;
    const coolingOffDays = parseInt(process.env.COOLING_OFF_DAYS || '10', 10);
    const coolingOffExpiry = new Date(Date.now() + coolingOffDays * 24 * 60 * 60 * 1000);

    const award = await prisma.award.create({
      data: { procurementId, winningBidderId, coolingOffExpiry },
    });

    await prisma.procurement.update({
      where: { id: procurementId },
      data: { status: 'AWARD_PUBLISHED', coolingOffExpiry },
    });

    await logAudit({
      req, action: 'AWARD_PUBLISHED', entityType: 'Award', entityId: award.id,
      newValue: { procurementId, winningBidderId, coolingOffExpiry },
    });

    res.status(201).json(award);
  } catch (err) {
    next(err);
  }
}

// FR-AWD-006: contract conclusion is blocked while cooling-off is active
// OR while any complaint on this procurement is not yet resolved.
async function concludeContract(req, res, next) {
  try {
    const award = await prisma.award.findUnique({ where: { procurementId: req.params.procurementId } });
    if (!award) return res.status(404).json({ error: 'No award found for this procurement.' });

    if (new Date() < new Date(award.coolingOffExpiry)) {
      return res.status(403).json({
        error: `Cooling-off period active until ${award.coolingOffExpiry.toISOString()}. Contract cannot be concluded.`,
      });
    }

    const openComplaints = await prisma.complaint.count({
      where: { procurementId: req.params.procurementId, status: { in: ['RECEIVED', 'UNDER_REVIEW', 'ESCALATED'] } },
    });
    if (openComplaints > 0) {
      return res.status(403).json({ error: 'Unresolved complaints exist for this procurement. Contract cannot be concluded.' });
    }

    const updated = await prisma.award.update({ where: { id: award.id }, data: { contractConcluded: true } });
    await prisma.procurement.update({ where: { id: req.params.procurementId }, data: { status: 'READY_FOR_CONTRACT' } });

    await logAudit({ req, action: 'CONTRACT_CONCLUDED', entityType: 'Award', entityId: award.id });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { createAward, concludeContract };
