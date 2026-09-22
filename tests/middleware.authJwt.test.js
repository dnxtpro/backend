/**
 * tests/middleware.authJwt.test.js
 * 
 * Tests for authJwt middleware: verifyToken, isAdmin, isModerator, isModeratorOrAdmin.
 * Mocks DB and JWT so no live connections needed.
 */

jest.mock('../model', () => ({
  user: {
    findByPk: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const db = require('../model');
const authJwt = require('../middleware/authJwt');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authJwt.verifyToken', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 403 when no token in session or header', () => {
    const req = { session: {}, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authJwt.verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('invalid token')));
    const req = { session: { token: 'bad-token' }, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authJwt.verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.userId on valid token', () => {
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, { id: 42 }));
    const req = { session: { token: 'valid.token' }, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authJwt.verifyToken(req, res, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalled();
  });
});

describe('authJwt.isAdmin', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 403 when user has no admin role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'user' }]),
    });
    const req = { userId: 1 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user has admin role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'admin' }]),
    });
    const req = { userId: 1 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('authJwt.isModeratorOrAdmin', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 403 when user only has "user" role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'user' }]),
    });
    const req = { userId: 99 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isModeratorOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user has "entrenador" role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'entrenador' }]),
    });
    const req = { userId: 99 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isModeratorOrAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('calls next when user has "moderator" role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'moderator' }]),
    });
    const req = { userId: 99 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isModeratorOrAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('calls next when user has "admin" role', async () => {
    db.user.findByPk.mockResolvedValue({
      getRoles: jest.fn().mockResolvedValue([{ name: 'admin' }]),
    });
    const req = { userId: 99 };
    const res = mockRes();
    const next = jest.fn();

    await authJwt.isModeratorOrAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
