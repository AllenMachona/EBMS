require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const procurementRoutes = require('./routes/procurement.routes');
const documentRoutes = require('./routes/document.routes');
const communicationRoutes = require('./routes/communication.routes');
const bidderRoutes = require('./routes/bidder.routes');
const submissionRoutes = require('./routes/submission.routes');
const openingRoutes = require('./routes/opening.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const awardRoutes = require('./routes/award.routes');
const complaintRoutes = require('./routes/complaint.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// SEC: basic brute-force protection on auth endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });
app.use('/api/auth/login', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/bidders', bidderRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/opening', openingRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`EBMS backend listening on port ${PORT}`));
