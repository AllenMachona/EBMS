const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { requireOpeningQuorum } = require('../middleware/openingQuorum');
const ctrl = require('../controllers/opening.controller');

router.use(authenticate, requireRole('OPENING_PANEL', 'PROCUREMENT_UNIT'));

router.post('/confirm', ctrl.confirmPresence);
router.get('/quorum/:procurementId/:envelopeType', ctrl.quorumStatus);
router.post('/open', requireOpeningQuorum, ctrl.openEnvelope);

module.exports = router;
