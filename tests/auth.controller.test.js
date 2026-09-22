/**
 * tests/auth.controller.test.js
 * 
 * Tests for auth controller logic (signup, signin, signout).
 * These tests mock DB and bcrypt so they run without a live MySQL connection.
 */

jest.mock('../model', () => ({
  user: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
  role: {
    findAll: jest.fn(),
  },
  equipo: {},
  Sequelize: {
    Op: { or: Symbol('or') },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
}));

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn().mockReturnValue('$hashed'),
  compareSync: jest.fn(),
}));

const db = require('../model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');

// Helper to create mock Express req/res
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('auth.controller - signup', () => {
  afterEach(() => jest.clearAllMocks());

  it('registers user with default role when no roles provided', async () => {
    const mockUser = {
      id: 1,
      setRoles: jest.fn().mockResolvedValue(true),
    };
    db.user.create.mockResolvedValue(mockUser);

    const req = {
      body: { username: 'testuser', email: 'test@test.com', password: 'password123' },
    };
    const res = mockRes();

    await authController.signup(req, res);

    expect(db.user.create).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@test.com',
      password: '$hashed',
    });
    expect(mockUser.setRoles).toHaveBeenCalledWith([1]);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('registered') })
    );
  });

  it('registers user with specified roles', async () => {
    const mockUser = {
      id: 2,
      setRoles: jest.fn().mockResolvedValue(true),
    };
    db.user.create.mockResolvedValue(mockUser);
    db.role.findAll.mockResolvedValue([{ id: 4, name: 'entrenador' }]);

    const req = {
      body: {
        username: 'coach1',
        email: 'coach@club.com',
        password: 'securePass1',
        roles: ['entrenador'],
      },
    };
    const res = mockRes();

    await authController.signup(req, res);

    expect(db.role.findAll).toHaveBeenCalled();
    expect(mockUser.setRoles).toHaveBeenCalledWith([{ id: 4, name: 'entrenador' }]);
  });

  it('returns 500 when DB create fails', async () => {
    db.user.create.mockRejectedValue(new Error('DB error'));

    const req = {
      body: { username: 'u', email: 'e@e.com', password: 'p12345678' },
    };
    const res = mockRes();

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth.controller - signin', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 404 when user not found', async () => {
    db.user.findOne.mockResolvedValue(null);

    const req = { body: { username: 'ghost', password: 'pass' }, session: {} };
    const res = mockRes();

    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'User Not found.' }));
  });

  it('returns 401 when password is wrong', async () => {
    db.user.findOne.mockResolvedValue({
      id: 1,
      username: 'coach',
      email: 'c@c.com',
      password: '$hashed',
      getRoles: jest.fn().mockResolvedValue([]),
    });
    bcrypt.compareSync.mockReturnValue(false);

    const req = { body: { username: 'coach', password: 'wrongPass' }, session: {} };
    const res = mockRes();

    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid Password!' }));
  });

  it('returns 200 with token and authorities on valid login', async () => {
    const mockUser = {
      id: 5,
      username: 'admin',
      email: 'admin@club.com',
      password: '$hashed',
      getRoles: jest.fn().mockResolvedValue([{ name: 'admin' }]),
    };
    db.user.findOne.mockResolvedValue(mockUser);
    bcrypt.compareSync.mockReturnValue(true);

    const req = { body: { username: 'admin', password: 'correct' }, session: {} };
    const res = mockRes();

    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'admin',
        token: 'mock.jwt.token',
        roles: ['ROLE_ADMIN'],
      })
    );
    expect(req.session.token).toBe('mock.jwt.token');
  });

  it('returns 500 on DB error', async () => {
    db.user.findOne.mockRejectedValue(new Error('connection error'));

    const req = { body: { username: 'u', password: 'p' }, session: {} };
    const res = mockRes();

    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('auth.controller - signout', () => {
  it('clears session and returns 200', async () => {
    const req = { session: { token: 'abc' } };
    const res = mockRes();

    await authController.signout(req, res);

    expect(req.session).toBeNull();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('signed out') }));
  });
});
