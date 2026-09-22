/**
 * tests/partido.controller.test.js
 * 
 * Unit tests for match (partido) controller: createMatch and deleteMatch.
 * Mocks DB models so no live MySQL connection is needed.
 */

jest.mock('../model', () => ({
  partido: {
    create: jest.fn(),
    destroy: jest.fn(),
    findByPk: jest.fn(),
  },
  matchevent: {
    findAll: jest.fn(),
    destroy: jest.fn(),
  },
  players: {
    findOne: jest.fn(),
  },
  sequelize: {
    query: jest.fn(),
  },
  Sequelize: {
    QueryTypes: { SELECT: 'SELECT' }
  }
}));

const db = require('../model');
const partidoController = require('../controllers/partido.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('partidoController.createMatch', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 when rivalTeam name is missing', async () => {
    const req = { body: { date: '2026-06-20', location: 'Home Stadium', equipoId: 1 }, userId: 1 };
    const res = mockRes();

    await partidoController.createMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Rival team name is required' }));
  });

  it('returns 400 when date is invalid', async () => {
    const req = { body: { rivalTeam: 'Team B', date: 'invalid-date', location: 'Home Stadium', equipoId: 1 }, userId: 1 };
    const res = mockRes();

    await partidoController.createMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'A valid match date is required' }));
  });

  it('returns 400 when location is missing', async () => {
    const req = { body: { rivalTeam: 'Team B', date: '2026-06-20', location: '', equipoId: 1 }, userId: 1 };
    const res = mockRes();

    await partidoController.createMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Match location is required' }));
  });

  it('returns 400 when equipoId is missing or invalid', async () => {
    const req = { body: { rivalTeam: 'Team B', date: '2026-06-20', location: 'Home Stadium', equipoId: 'abc' }, userId: 1 };
    const res = mockRes();

    await partidoController.createMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Valid equipoId is required' }));
  });

  it('creates the match successfully on valid inputs', async () => {
    const mockMatch = { id: 10, rivalTeam: 'Team B', date: new Date('2026-06-20'), location: 'Home Stadium', userId: 1, equipoId: 1 };
    db.partido.create.mockResolvedValue(mockMatch);

    const req = { body: { rivalTeam: 'Team B', date: '2026-06-20', location: 'Home Stadium', equipoId: 1 }, userId: 1 };
    const res = mockRes();

    await partidoController.createMatch(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockMatch);
  });
});
