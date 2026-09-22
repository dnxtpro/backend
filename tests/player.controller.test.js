/**
 * tests/player.controller.test.js
 * 
 * Unit tests for players controller: findPlayers and createPlayer.
 * Mocks DB models so no live MySQL connection is needed.
 */

jest.mock('../model', () => ({
  equipo: {
    findAll: jest.fn(),
  },
  user: {
    findAll: jest.fn(),
  },
  players: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
  positions: {},
}));

const db = require('../model');
const playersController = require('../controllers/players.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('playersController.findPlayers', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 404 if no teams are found for the user', async () => {
    db.equipo.findAll.mockResolvedValue([]);
    const req = { userId: 1 };
    const res = mockRes();

    await playersController.findPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'No teams found for this user.' });
  });

  it('returns 404 if no players are found', async () => {
    db.equipo.findAll.mockResolvedValue([{ id: 10 }]);
    db.user.findAll.mockResolvedValue([{ id: 1 }]);
    db.players.findAll.mockResolvedValue([]);
    const req = { userId: 1 };
    const res = mockRes();

    await playersController.findPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'No players found' });
  });

  it('returns players array on success', async () => {
    db.equipo.findAll.mockResolvedValue([{ id: 10 }]);
    db.user.findAll.mockResolvedValue([{ id: 1 }]);
    
    const mockPlayer = {
      player_id: 100,
      player_name: 'John Doe',
      dorsal: 7,
      position_id: 1,
      position: { position_name: 'Setter' },
      equipo: { nombre: 'Team A' },
      ser: { username: 'johndoe' },
      toJSON: function() { return this; }
    };
    db.players.findAll.mockResolvedValue([mockPlayer]);

    const req = { userId: 1 };
    const res = mockRes();

    await playersController.findPlayers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith([
      {
        player_id: 100,
        name: 'John Doe',
        dorsal: 7,
        positionId: 1,
        position_name: 'Setter',
        nombre_equipo: 'Team A',
        mainUser: 'johndoe'
      }
    ]);
  });
});
