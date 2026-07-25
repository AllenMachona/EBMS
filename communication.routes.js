const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/communication.controller');

router.use(authenticate);
router.post('/', ctrl.postCommunication);
router.get('/:procurementId', ctrl.listCommunications);

module.exports = router;
