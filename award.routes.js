const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/award.controller');

router.use(authenticate);
router.post('/', requireRole('ACCOUNTING_OFFICER'), ctrl.createAward);
router.post('/:procurementId/conclude', requireRole('PROCUREMENT_UNIT', 'ACCOUNTING_OFFICER'), ctrl.concludeContract);

module.exports = router;
