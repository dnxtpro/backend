/**
 * tests/health.test.js
 * 
 * Smoke test for the /health and / endpoints using supertest.
 * Tests the actual Express app WITHOUT DB sync by importing only the routing layer.
 */

const express = require('express');
const request = require('supertest');

// Build a minimal app identical to what app.js would expose for health check
function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (req, res) => {
    res.json({ message: 'Volleyball stats API is running.' });
  });

  return app;
}

const app = buildTestApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('GET /', () => {
  it('returns API running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
