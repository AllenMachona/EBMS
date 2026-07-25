const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const { sha256 } = require('../utils/encryption');
const { logAudit } = require('../middleware/audit');

// Bidding documents are NOT bid submissions — they are published, not
// sealed, so they are stored as plaintext with an integrity hash only
// (FR-DOC-007), not encrypted like submissions (see submission.controller).
async function uploadDocument(req, res, next) {
  try {
    const { procurementId, type } = req.body;
    if (!req.file) return res.status(400).json({ error: 'A file is required.' });

    const hash = sha256(req.file.buffer);
    const storedName = `${Date.now()}-${req.file.originalname}`;
    const storedPath = path.join(__dirname, '..', 'uploads', storedName);
    fs.writeFileSync(storedPath, req.file.buffer);

    const doc = await prisma.document.create({
      data: {
        procurementId,
        name: req.file.originalname,
        type: type || 'OTHER',
        filePath: storedPath,
        sha256Hash: hash,
        uploadedById: req.user.id,
      },
    });

    await logAudit({
      req, action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: doc.id,
      newValue: { name: doc.name, hash: doc.sha256Hash },
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      where: { procurementId: req.params.procurementId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, listDocuments };
