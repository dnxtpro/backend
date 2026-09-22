module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    code: status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
