// Role-based access control (SOAR Section 5, Appendix A).
// Usage: router.post('/x', authenticate, requireRole('PROCUREMENT_UNIT'), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

// Segregation of duties: blocks a user from approving/actioning a record
// they themselves created or initiated (SOAR 5.1).
function forbidSelfApproval(getInitiatorId) {
  return async (req, res, next) => {
    try {
      const initiatorId = await getInitiatorId(req);
      if (initiatorId && initiatorId === req.user.id) {
        return res.status(403).json({
          error: 'Segregation of duties: you cannot approve an action you initiated.',
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, forbidSelfApproval };
