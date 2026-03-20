const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Server error';

  console.error('Request failed', {
    path: req.originalUrl,
    method: req.method,
    status,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  res.status(status).json({ message });
};

module.exports = errorHandler;
