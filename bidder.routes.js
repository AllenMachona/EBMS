const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/bidder.controller');

router.post('/register', ctrl.registerBidder); // public — company self-registration
router.get('/', authenticate, requireRole('PROCUREMENT_UNIT', 'OVERSIGHT_UNIT', 'AUDITOR'), ctrl.listBidders);
router.patch('/:id/verify', authenticate, requireRole('PROCUREMENT_UNIT'), ctrl.verifyBidder);

module.exports = router;
