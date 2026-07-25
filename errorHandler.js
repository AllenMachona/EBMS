function notFound(req, res) {
  res.status(404).json({ error: 'Resource not found.' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
