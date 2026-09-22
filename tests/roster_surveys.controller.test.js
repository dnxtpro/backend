const crypto = require('crypto');

// Mock models
jest.mock('../model', () => {
  const Sequelize = {
    Op: {
      in: Symbol('in'),
      or: Symbol('or')
    }
  };
  return {
    players: {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn()
    },
    user: {
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn()
    },
    role: {
      findAll: jest.fn()
    },
    equipo: {
      findByPk: jest.fn()
    },
    positions: {
      findAll: jest.fn()
    },
    playerTokens: {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn()
    },
    surveys: {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn()
    },
    surveyQuestions: {
      create: jest.fn(),
      destroy: jest.fn()
    },
    surveyResponses: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn()
    },
    Sequelize,
    sequelize: {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn()
      })
    }
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token')
}));

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn().mockReturnValue('$hashedPassword'),
  compareSync: jest.fn().mockReturnValue(true)
}));

const db = require('../model');
const rosterController = require('../controllers/roster.controller');
const surveysController = require('../controllers/surveys.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn();
  res.setHeader = jest.fn();
  res.end = jest.fn();
  return res;
}

describe('Roster & Invitations Controller', () => {
  afterEach(() => jest.clearAllMocks());

  it('preselects an individual player successfully', async () => {
    const mockCreated = { player_id: 10, player_name: 'Olga', status: 'PRESELECTED' };
    db.players.create.mockResolvedValue(mockCreated);

    const req = {
      userId: 1,
      body: { name: 'Olga', apellidos: 'Tejada', equipoId: 2 }
    };
    const res = mockRes();

    await rosterController.preselectPlayer(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(mockCreated);
  });

  it('generates an invitation token and revokes active ones', async () => {
    const mockPlayer = {
      player_id: 5,
      player_name: 'Camilla',
      apellidos: '',
      status: 'PRESELECTED',
      equipo: { nombre: 'Senior Femenino' },
      update: jest.fn().mockResolvedValue(true)
    };
    db.players.findByPk.mockResolvedValue(mockPlayer);
    db.playerTokens.update.mockResolvedValue([1]);
    db.playerTokens.create.mockResolvedValue({ id: 1 });

    const req = {
      userId: 1,
      body: { playerId: 5 },
      get: jest.fn().mockReturnValue('http://localhost:4200')
    };
    const res = mockRes();

    await rosterController.generateInvitation(req, res);
    expect(db.playerTokens.update).toHaveBeenCalled();
    expect(db.playerTokens.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const sentData = res.send.mock.calls[0][0];
    expect(sentData.token).toBeDefined();
    expect(sentData.url).toContain('/activar-cuenta/');
    expect(sentData.whatsappUrl).toContain('https://wa.me/?text=');
  });

  it('rejects expired or used token on verification', async () => {
    // Expired token mock
    db.playerTokens.findOne.mockResolvedValue({
      token_hash: 'abc',
      expires_at: new Date(Date.now() - 10000), // in the past
      used_at: null,
      revoked_at: null
    });

    const req = { params: { token: 'mocktoken' } };
    const res = mockRes();

    await rosterController.getTokenInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
  });
});

describe('Surveys Controller', () => {
  afterEach(() => jest.clearAllMocks());

  it('instantiates the initial "Construyamos la temporada" template', async () => {
    db.equipo.findByPk.mockResolvedValue({ id: 2, nombre: 'Senior Femenino' });
    db.surveys.create.mockResolvedValue({ id: 1, title: 'Construyamos la temporada | Senior Femenino' });
    db.surveys.findByPk.mockResolvedValue({
      id: 1,
      title: 'Construyamos la temporada | Senior Femenino',
      questions: new Array(9).fill({})
    });

    const req = {
      userId: 1,
      body: { equipoId: 2 }
    };
    const res = mockRes();

    await surveysController.instantiateInitialTemplate(req, res);
    expect(db.surveys.create).toHaveBeenCalled();
    expect(db.surveyQuestions.create).toHaveBeenCalledTimes(9);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('saves draft for player successfully', async () => {
    db.players.findOne.mockResolvedValue({ player_id: 5, equipoId: 2 });
    db.surveys.findByPk.mockResolvedValue({ id: 1, equipoId: 2 });
    db.surveyResponses.findOne.mockResolvedValue(null);
    db.surveyResponses.create.mockResolvedValue({ id: 99, status: 'DRAFT' });

    const req = {
      userId: 10,
      params: { id: 1 },
      body: { answers: { 1: ['Mejorar', 'Competir'] } }
    };
    const res = mockRes();

    await surveysController.saveDraft(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(db.surveyResponses.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'DRAFT' }));
  });

  it('prevents multiple final submissions from same player', async () => {
    db.players.findOne.mockResolvedValue({ player_id: 5, equipoId: 2 });
    db.surveys.findOne.mockResolvedValue({
      id: 1,
      equipoId: 2,
      status: 'OPEN',
      questions: []
    });
    // Response already submitted
    db.surveyResponses.findOne.mockResolvedValue({
      id: 99,
      status: 'SUBMITTED'
    });

    const req = {
      userId: 10,
      params: { id: 1 },
      body: { answers: {} }
    };
    const res = mockRes();

    await surveysController.submitResponse(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
