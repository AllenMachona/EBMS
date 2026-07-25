const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/document.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);
router.post('/', requireRole('PROCUREMENT_UNIT', 'USER_DEPARTMENT'), upload.single('file'), ctrl.uploadDocument);
router.get('/:procurementId', ctrl.listDocuments);

module.exports = router;
