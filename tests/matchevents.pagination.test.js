/**
 * tests/matchevents.pagination.test.js
 * 
 * Unit tests validating pagination parameters support (limit, size, offset) in getEventDetails.
 * Mocks DB calls so no live MySQL connection is needed.
 */

jest.mock('../model', () => ({
  partido: {
    findByPk: jest.fn(),
  },
  players: {
    findOne: jest.fn(),
  },
  matchevent: {},
  sequelize: {
    query: jest.fn(),
  },
  Sequelize: {
    QueryTypes: { SELECT: 'SELECT' }
  }
}));

const db = require('../model');
const matcheventsController = require('../controllers/matchevents.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('matcheventsController.getEventDetails pagination', () => {
  afterEach(() => jest.clearAllMocks());

  it('runs original query without limit/offset if they are not passed', async () => {
    // Mock access checks (allowed & exists)
    db.partido.findByPk.mockResolvedValue({ id: 10, equipoId: 1, userId: 42 });
    db.sequelize.query.mockResolvedValueOnce([{ linked: 1 }]); // userCanAccessMatch query
    db.sequelize.query.mockResolvedValueOnce([{ player_name: 'Player 1', event_count: 5 }]); // getEventDetails query

    const req = { userId: 42, params: { matchId: '10' }, query: {} };
    const res = mockRes();

    await matcheventsController.getEventDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Verify that the second call to db.sequelize.query did NOT append LIMIT/OFFSET in replacements
    expect(db.sequelize.query).toHaveBeenLastCalledWith(
      expect.not.stringContaining('LIMIT'),
      expect.objectContaining({
        replacements: { matchId: 10 },
        type: 'SELECT'
      })
    );
  });

  it('appends LIMIT to query when limit or size parameter is provided', async () => {
    db.partido.findByPk.mockResolvedValue({ id: 10, equipoId: 1, userId: 42 });
    db.sequelize.query.mockResolvedValueOnce([{ linked: 1 }]);
    db.sequelize.query.mockResolvedValueOnce([]);

    const req = { userId: 42, params: { matchId: '10' }, query: { size: '15' } };
    const res = mockRes();

    await matcheventsController.getEventDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Verify SQL query has LIMIT and replacements contains limit: 15
    expect(db.sequelize.query).toHaveBeenLastCalledWith(
      expect.stringContaining('LIMIT :limit'),
      expect.objectContaining({
        replacements: { matchId: 10, limit: 15 },
        type: 'SELECT'
      })
    );
  });

  it('appends OFFSET to query when offset parameter is provided', async () => {
    db.partido.findByPk.mockResolvedValue({ id: 10, equipoId: 1, userId: 42 });
    db.sequelize.query.mockResolvedValueOnce([{ linked: 1 }]);
    db.sequelize.query.mockResolvedValueOnce([]);

    const req = { userId: 42, params: { matchId: '10' }, query: { limit: '10', offset: '20' } };
    const res = mockRes();

    await matcheventsController.getEventDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Verify SQL query has LIMIT and OFFSET and replacements are correct
    expect(db.sequelize.query).toHaveBeenLastCalledWith(
      expect.stringContaining('LIMIT :limit OFFSET :offset'),
      expect.objectContaining({
        replacements: { matchId: 10, limit: 10, offset: 20 },
        type: 'SELECT'
      })
    );
  });
});
