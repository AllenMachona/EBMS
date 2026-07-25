const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { logAudit } = require('../middleware/audit');

// FR self-registration: a company registers once and gets a linked portal
// user. `verified` starts false — a Procurement Unit user must confirm
// PPRA registration/status before the bidder is treated as eligible
// (SOAR 7.5), though the account can browse public tender info immediately.
async function registerBidder(req, res, next) {
  try {
    const { companyName, registrationNumber, ppraCode, contactEmail, contactPhone, adminName, adminPassword } = req.body;
    if (!companyName || !registrationNumber || !contactEmail || !adminName || !adminPassword) {
      return res.status(400).json({ error: 'Missing required registration fields.' });
    }

    const existingBidder = await prisma.bidder.findUnique({ where: { registrationNumber } });
    if (existingBidder) return res.status(409).json({ error: 'This company is already registered.' });

    const existingUser = await prisma.user.findUnique({ where: { email: contactEmail } });
    if (existingUser) return res.status(409).json({ error: 'This email is already in use.' });

    const bidder = await prisma.bidder.create({
      data: { companyName, registrationNumber, ppraCode, contactEmail, contactPhone },
    });

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: adminName,
        email: contactEmail,
        passwordHash,
        role: 'BIDDER',
        bidderId: bidder.id,
      },
    });

    await logAudit({ req, action: 'BIDDER_REGISTERED', entityType: 'Bidder', entityId: bidder.id, newValue: bidder });

    res.status(201).json({ bidder, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function verifyBidder(req, res, next) {
  try {
    const bidder = await prisma.bidder.update({
      where: { id: req.params.id },
      data: { verified: true },
    });
    await logAudit({ req, action: 'BIDDER_VERIFIED', entityType: 'Bidder', entityId: bidder.id });
    res.json(bidder);
  } catch (err) {
    next(err);
  }
}

async function listBidders(req, res, next) {
  try {
    const bidders = await prisma.bidder.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(bidders);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerBidder, verifyBidder, listBidders };
