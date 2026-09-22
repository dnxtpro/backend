const { z } = require('zod');

const createMatchSchema = z.object({
  body: z.object({
    rivalTeam: z.string({
      required_error: 'Rival team is required',
    }).min(1, 'Rival team cannot be empty'),
    date: z.string({
      required_error: 'Date is required',
    }),
    location: z.string({
      required_error: 'Location is required',
    }),
    equipoId: z.number({
      required_error: 'Team ID is required',
    }).positive(),
  }),
});

const createMatchEventSchema = z.object({
  body: z.object({
    matchEventData: z.object({
      matchId: z.number().positive(),
      actionType: z.string(),
      playerId: z.number().positive(),
      scoreLocal: z.number().min(0),
      scoreVisitor: z.number().min(0),
      setsLocal: z.number().min(0),
      setsVisitor: z.number().min(0),
      eventId: z.number().positive(),
    }),
    conSaque: z.boolean(),
  }),
});

const createAnotacionSchema = z.object({
  body: z.object({
    player_ids: z.array(z.number()),
    nombre: z.string(),
    timestamp: z.number(),
    eventId: z.number().positive(),
  }),
});

module.exports = {
  createMatchSchema,
  createMatchEventSchema,
  createAnotacionSchema,
};
