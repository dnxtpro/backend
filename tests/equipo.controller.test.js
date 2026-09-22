/**
 * tests/equipo.controller.test.js
 * 
 * Tests for team (equipo) controller: create team, get user teams, get all teams.
 */

jest.mock('../model', () => ({
  equipo: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  user: {
    findByPk: jest.fn(),
  },
  players: {
    create: jest.fn(),
  },
  Sequelize: {},
  sequelize: {},
}));

const db = require('../model');
const equipoController = require('../controllers/equipo.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('equipo.controller - equipo (create team)', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates team and returns it with 200', async () => {
    const mockEquipo = {
      id: 1,
      nombre: 'Team A',
      addEquipa: jest.fn().mockResolvedValue(true),
    };
    db.equipo.create.mockResolvedValue(mockEquipo);
    db.players.create.mockResolvedValue({});

    const req = { body: { team: 'Team A' }, userId: 7 };
    const res = mockRes();

    await equipoController.equipo(req, res);

    expect(db.equipo.create).toHaveBeenCalledWith({ nombre: 'Team A' });
    expect(mockEquipo.addEquipa).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockEquipo);
  });

  it('returns 500 when DB create fails', async () => {
    db.equipo.create.mockRejectedValue(new Error('DB error'));

    const req = { body: { team: 'Fail' }, userId: 1 };
    const res = mockRes();

    await equipoController.equipo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('equipo.controller - obtenerEquipos (get all teams)', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns all teams with 200', async () => {
    db.equipo.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = {};
    const res = mockRes();

    await equipoController.obtenerEquipos(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it('returns 500 when DB fails', async () => {
    db.equipo.findAll.mockRejectedValue(new Error('connection lost'));

    const req = {};
    const res = mockRes();

    await equipoController.obtenerEquipos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
