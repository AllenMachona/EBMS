const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/procurement.controller');

router.use(authenticate);

router.post('/', requireRole('PROCUREMENT_UNIT', 'USER_DEPARTMENT'), ctrl.createProcurement);
router.get('/', ctrl.listProcurements);
router.get('/:id', ctrl.getProcurement);
router.patch(
  '/:id/status',
  requireRole('PROCUREMENT_UNIT', 'ACCOUNTING_OFFICER', 'OVERSIGHT_UNIT', 'OPENING_PANEL'),
  ctrl.transitionStatus
);

module.exports = router;
