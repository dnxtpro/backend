/**
 * tests/verifySignUp.test.js
 * 
 * Tests for verifySignUp middleware: checkSignupFields, checkDuplicateUsernameOrEmail, checkRolesExisted.
 * Mocks DB so no live connection is needed.
 */

jest.mock('../model', () => ({
  user: {
    findOne: jest.fn(),
  },
  ROLES: ['user', 'admin', 'moderator', 'entrenador'],
}));

const db = require('../model');
const verifySignUp = require('../middleware/verifySignUp');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('verifySignUp.checkSignupFields', () => {
  it('rejects username shorter than 3 chars', () => {
    const req = { body: { username: 'ab', email: 'a@b.com', password: 'longpassword' } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkSignupFields(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid email', () => {
    const req = { body: { username: 'abc', email: 'notanemail', password: 'longpassword' } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkSignupFields(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects password shorter than 8 chars', () => {
    const req = { body: { username: 'abc', email: 'a@b.com', password: 'short' } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkSignupFields(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for valid fields', () => {
    const req = { body: { username: 'validuser', email: 'v@club.com', password: 'goodpassword' } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkSignupFields(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('verifySignUp.checkRolesExisted', () => {
  it('rejects unknown role', () => {
    const req = { body: { roles: ['superuser'] } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkRolesExisted(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid role names', () => {
    const req = { body: { roles: ['entrenador'] } };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkRolesExisted(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('calls next when no roles provided', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    verifySignUp.checkRolesExisted(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('verifySignUp.checkDuplicateUsernameOrEmail', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 when username already exists', async () => {
    db.user.findOne.mockResolvedValueOnce({ id: 1, username: 'taken' });
    const req = { body: { username: 'taken', email: 'new@e.com' } };
    const res = mockRes();
    const next = jest.fn();

    await verifySignUp.checkDuplicateUsernameOrEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when email already exists', async () => {
    db.user.findOne
      .mockResolvedValueOnce(null) // username not found
      .mockResolvedValueOnce({ id: 2 }); // email found
    const req = { body: { username: 'newuser', email: 'taken@e.com' } };
    const res = mockRes();
    const next = jest.fn();

    await verifySignUp.checkDuplicateUsernameOrEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('calls next when both username and email are free', async () => {
    db.user.findOne.mockResolvedValue(null);
    const req = { body: { username: 'fresh', email: 'fresh@e.com' } };
    const res = mockRes();
    const next = jest.fn();

    await verifySignUp.checkDuplicateUsernameOrEmail(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
