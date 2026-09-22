module.exports = {
  // B9: JWT secret MUST be set via JWT_SECRET environment variable.
  // The fallback is intentionally non-empty to prevent startup crashes but
  // a warning is printed at startup (see app.js) if this fallback is used.
  secret: process.env.JWT_SECRET || 'change-me-in-env-file'
};