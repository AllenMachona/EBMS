const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { enforceBidderIsolation } = require('../middleware/bidderIsolation');
const ctrl = require('../controllers/complaint.controller');

router.use(authenticate);
router.post('/', requireRole('BIDDER'), enforceBidderIsolation, ctrl.fileComplaint);
router.patch('/:id/resolve', requireRole('ACCOUNTING_OFFICER', 'OVERSIGHT_UNIT'), ctrl.resolveComplaint);
router.get('/:procurementId', requireRole('PROCUREMENT_UNIT', 'ACCOUNTING_OFFICER', 'OVERSIGHT_UNIT', 'AUDITOR'), ctrl.listComplaints);

module.exports = router;
