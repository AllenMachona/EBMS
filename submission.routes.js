const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { enforceBidderIsolation } = require('../middleware/bidderIsolation');
const ctrl = require('../controllers/submission.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // NFR-003: 2GB default

router.use(authenticate);

router.post('/', requireRole('BIDDER'), enforceBidderIsolation, upload.single('file'), ctrl.submitBid);
router.patch('/:id/withdraw', requireRole('BIDDER'), enforceBidderIsolation, ctrl.withdrawSubmission);
router.get('/mine/:procurementId', requireRole('BIDDER'), enforceBidderIsolation, ctrl.myBidderSubmissions);
router.get(
  '/register/:procurementId',
  requireRole('PROCUREMENT_UNIT', 'OPENING_PANEL', 'OVERSIGHT_UNIT', 'AUDITOR'),
  ctrl.submissionRegister
);

module.exports = router;
