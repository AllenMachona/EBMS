const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/evaluation.controller');

router.use(authenticate);

router.post('/committee', requireRole('PROCUREMENT_UNIT', 'ACCOUNTING_OFFICER'), ctrl.createCommittee);
router.post('/score', requireRole('COMMITTEE_MEMBER', 'COMMITTEE_CHAIR'), ctrl.submitScore);
router.get(
  '/consensus/:procurementId/:stage',
  requireRole('COMMITTEE_CHAIR', 'COMMITTEE_SECRETARY', 'PROCUREMENT_UNIT'),
  ctrl.consensusView
);

module.exports = router;
