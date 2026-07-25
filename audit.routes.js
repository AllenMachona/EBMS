const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/audit.controller');

router.use(authenticate, requireRole('AUDITOR', 'OVERSIGHT_UNIT', 'SYSTEM_ADMIN'));
router.get('/', ctrl.listAuditLogs);

module.exports = router;
