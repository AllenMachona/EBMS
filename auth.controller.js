const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { logAudit } = require('../middleware/audit');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'A user with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, department },
    });

    await logAudit({ req, action: 'USER_REGISTERED', entityType: 'User', entityId: user.id });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      await logAudit({ req, action: 'LOGIN_FAILED', entityType: 'User', reason: 'unknown or inactive account' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAudit({ req, action: 'LOGIN_FAILED', entityType: 'User', entityId: user.id, reason: 'bad password' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    req.user = user; // for audit logging below
    await logAudit({ req, action: 'LOGIN_SUCCESS', entityType: 'User', entityId: user.id });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, bidderId: user.bidderId },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  const { id, name, email, role, department, bidderId } = req.user;
  res.json({ id, name, email, role, department, bidderId });
}

module.exports = { register, login, me };
