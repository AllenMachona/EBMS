const prisma = require('../config/db');

// AC-01 / AC-02: a bidder user may only ever see or act on records
// belonging to their own bidder company. This is checked server-side on
// every submission-related route — never trust a client-supplied bidderId.
async function enforceBidderIsolation(req, res, next) {
  if (req.user.role !== 'BIDDER') return next(); // non-bidder roles governed by RBAC elsewhere

  if (!req.user.bidderId) {
    return res.status(403).json({ error: 'Bidder account is not linked to a registered company.' });
  }

  const requestedBidderId = req.params.bidderId || req.body.bidderId;
  if (requestedBidderId && requestedBidderId !== req.user.bidderId) {
    return res.status(403).json({ error: 'You may not access another bidder\'s records.' });
  }

  // Force any downstream query to use the authenticated bidder's own id,
  // regardless of what (if anything) was supplied in the request.
  req.body.bidderId = req.user.bidderId;
  next();
}

module.exports = { enforceBidderIsolation };
