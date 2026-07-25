const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');

async function fileComplaint(req, res, next) {
  try {
    const { procurementId, grounds, reliefSought } = req.body;
    const bidderId = req.user.bidderId;

    const complaint = await prisma.complaint.create({
      data: { procurementId, bidderId, grounds, reliefSought },
    });

    // Filing a complaint places the procurement on hold, blocking contract conclusion.
    await prisma.procurement.update({ where: { id: procurementId }, data: { status: 'COMPLAINT_HOLD' } });

    await logAudit({ req, action: 'COMPLAINT_FILED', entityType: 'Complaint', entityId: complaint.id, newValue: complaint });
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
}

async function resolveComplaint(req, res, next) {
  try {
    const { status, decision } = req.body; // UPHELD | DISMISSED | ESCALATED
    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data: { status, decision },
    });

    const remainingOpen = await prisma.complaint.count({
      where: { procurementId: complaint.procurementId, status: { in: ['RECEIVED', 'UNDER_REVIEW', 'ESCALATED'] } },
    });
    if (remainingOpen === 0) {
      await prisma.procurement.update({ where: { id: complaint.procurementId }, data: { status: 'COOLING_OFF' } });
    }

    await logAudit({ req, action: 'COMPLAINT_RESOLVED', entityType: 'Complaint', entityId: complaint.id, newValue: { status, decision } });
    res.json(complaint);
  } catch (err) {
    next(err);
  }
}

async function listComplaints(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { procurementId: req.params.procurementId },
      include: { bidder: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(complaints);
  } catch (err) {
    next(err);
  }
}

module.exports = { fileComplaint, resolveComplaint, listComplaints };
