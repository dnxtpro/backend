const ExcelJS = require('exceljs');
const db = require('../model');

const Survey = db.surveys;
const SurveyQuestion = db.surveyQuestions;
const SurveyResponse = db.surveyResponses;
const Player = db.players;
const User = db.user;
const Equipo = db.equipo;
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;

// Template definition for initial survey
const INITIAL_SURVEY_TEMPLATE = {
  title: 'Construyamos la temporada | Senior Femenino',
  description: 'Encuesta inicial de visión de equipo, objetivos, clima deportivo y metas colectivas.',
  questions: [
    {
      title: '¿Qué te hace seguir jugando al voleibol?',
      description: 'Puedes seleccionar varias opciones.',
      type: 'MULTIPLE_CHOICE',
      required: true,
      order: 1,
      options: [
        'Mejorar',
        'Competir',
        'Hacer equipo',
        'Desconectar',
        'Estar con amigas',
        'Sentirme activa',
        'Ambiente de partidos',
        'Otra'
      ]
    },
    {
      title: 'Al terminar la temporada, me gustaría poder decir que…',
      description: 'Expresa tu visión personal para el final de curso.',
      type: 'LONG_TEXT',
      required: true,
      order: 2
    },
    {
      title: '¿Qué tres palabras te gustaría que describieran a nuestro equipo al acabar la temporada?',
      description: 'Ejemplo: Unión, constancia, alegría.',
      type: 'LONG_TEXT',
      required: true,
      order: 3
    },
    {
      title: 'Ordena estas prioridades para la temporada, de mayor a menor importancia.',
      description: 'Coloca en primera posición lo más prioritario.',
      type: 'RANKING',
      required: true,
      order: 4,
      options: [
        'Mejorar el nivel',
        'Competir cada partido',
        'Lograr una buena clasificación',
        'Mantener un gran ambiente',
        'Disfrutar del voleibol'
      ]
    },
    {
      title: '¿Con qué frase te identificas más respecto a una temporada ideal?',
      description: 'Elige la que mejor refleje tu enfoque competitivo.',
      type: 'SINGLE_CHOICE',
      required: true,
      order: 5,
      options: [
        'Quiero entrenar y competir con ambición; los resultados deben llegar como consecuencia.',
        'Quiero que el equipo dé un salto de nivel, aunque la clasificación no sea lo único.',
        'Quiero pelear por estar arriba y aspirar a lo máximo.',
        'Quiero un equilibrio entre mejorar, competir y disfrutar.',
        'Para mí lo más importante es mantener el grupo, jugar y pasarlo bien.',
        'Aún no lo tengo claro.'
      ]
    },
    {
      title: 'Aunque no se consiga el resultado clasificatorio esperado, ¿cuándo considerarías buena la temporada?',
      description: 'Selecciona tu criterio principal.',
      type: 'SINGLE_CHOICE',
      required: true,
      order: 6,
      options: [
        'Si hemos mejorado claramente como equipo.',
        'Si hemos competido de tú a tú contra equipos fuertes.',
        'Si hemos mantenido unión, actitud y constancia.',
        'Solo si se alcanza el objetivo de clasificación.',
        'Dependería de cómo haya sido el camino.'
      ]
    },
    {
      title: '¿Qué debería distinguir a nuestro equipo frente al resto?',
      description: 'Identidad, actitud o juego colectivo.',
      type: 'LONG_TEXT',
      required: true,
      order: 7
    },
    {
      title: '¿Qué no deberíamos perder nunca como equipo, incluso en semanas difíciles o después de perder?',
      description: 'Los valores innegociables del grupo.',
      type: 'LONG_TEXT',
      required: true,
      order: 8
    },
    {
      title: '¿Qué equilibrio te gustaría que hubiera entre exigencia y disfrute?',
      description: 'Nivel de exigencia competitiva deseado.',
      type: 'SCALE',
      required: true,
      order: 9,
      config: {
        min: 1,
        max: 5,
        minLabel: 'Principalmente relajado, social y de disfrute',
        maxLabel: 'Muy exigente, enfocado en mejorar y competir'
      }
    }
  ]
};

// 1. Instantiate Initial Template for a team (Coach/Admin)
exports.instantiateInitialTemplate = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { equipoId } = req.body;
    const userId = req.userId;

    if (!equipoId) {
      await t.rollback();
      return res.status(400).send({ message: 'equipoId es obligatorio.' });
    }

    const team = await Equipo.findByPk(equipoId);
    if (!team) {
      await t.rollback();
      return res.status(404).send({ message: 'Equipo no encontrado.' });
    }

    const survey = await Survey.create({
      title: INITIAL_SURVEY_TEMPLATE.title,
      description: INITIAL_SURVEY_TEMPLATE.description,
      equipoId: equipoId,
      status: 'OPEN',
      results_published: false,
      created_by: userId
    }, { transaction: t });

    for (const q of INITIAL_SURVEY_TEMPLATE.questions) {
      await SurveyQuestion.create({
        survey_id: survey.id,
        title: q.title,
        description: q.description || null,
        type: q.type,
        required: q.required !== undefined ? q.required : true,
        order: q.order,
        options: q.options || null,
        config: q.config || null
      }, { transaction: t });
    }

    await t.commit();

    const created = await Survey.findByPk(survey.id, {
      include: [{ model: SurveyQuestion, as: 'questions' }]
    });

    return res.status(201).send({
      message: 'Encuesta "Construyamos la temporada" instanciada correctamente.',
      survey: created
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 2. Create Custom Survey (Coach/Admin)
exports.createSurvey = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { title, description, equipoId, status, questions, opens_at, closes_at } = req.body;
    const userId = req.userId;

    if (!title || !equipoId) {
      await t.rollback();
      return res.status(400).send({ message: 'Título y equipoId son obligatorios.' });
    }

    const survey = await Survey.create({
      title,
      description: description || null,
      equipoId,
      status: status || 'DRAFT',
      results_published: false,
      created_by: userId,
      opens_at: opens_at || null,
      closes_at: closes_at || null
    }, { transaction: t });

    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await SurveyQuestion.create({
          survey_id: survey.id,
          title: q.title,
          description: q.description || null,
          type: q.type,
          required: q.required !== undefined ? q.required : true,
          order: q.order !== undefined ? q.order : i + 1,
          options: q.options || null,
          config: q.config || null
        }, { transaction: t });
      }
    }

    await t.commit();

    const result = await Survey.findByPk(survey.id, {
      include: [{ model: SurveyQuestion, as: 'questions' }]
    });

    return res.status(201).send(result);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 3. Update Survey (Coach/Admin)
exports.updateSurvey = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { title, description, status, results_published, captain_player_id, opens_at, closes_at, questions } = req.body;

    const survey = await Survey.findByPk(id, { transaction: t });
    if (!survey) {
      await t.rollback();
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    await survey.update({
      title: title !== undefined ? title : survey.title,
      description: description !== undefined ? description : survey.description,
      status: status !== undefined ? status : survey.status,
      results_published: results_published !== undefined ? results_published : survey.results_published,
      captain_player_id: captain_player_id !== undefined ? captain_player_id : survey.captain_player_id,
      opens_at: opens_at !== undefined ? opens_at : survey.opens_at,
      closes_at: closes_at !== undefined ? closes_at : survey.closes_at
    }, { transaction: t });

    // Update questions if provided and survey has no submitted responses
    if (Array.isArray(questions)) {
      const submittedCount = await SurveyResponse.count({
        where: { survey_id: id, status: 'SUBMITTED' },
        transaction: t
      });

      if (submittedCount === 0) {
        await SurveyQuestion.destroy({ where: { survey_id: id }, transaction: t });
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await SurveyQuestion.create({
            survey_id: id,
            title: q.title,
            description: q.description || null,
            type: q.type,
            required: q.required !== undefined ? q.required : true,
            order: q.order !== undefined ? q.order : i + 1,
            options: q.options || null,
            config: q.config || null
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    const updated = await Survey.findByPk(id, {
      include: [
        { model: SurveyQuestion, as: 'questions' },
        { model: Player, as: 'captain', attributes: ['player_id', 'player_name', 'apellidos', 'dorsal'] }
      ]
    });

    return res.status(200).send(updated);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 4. Update Survey Status or Results Published (Coach/Admin)
exports.updateSurveyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, results_published, captain_player_id } = req.body;

    const survey = await Survey.findByPk(id);
    if (!survey) {
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (results_published !== undefined) updates.results_published = results_published;
    if (captain_player_id !== undefined) updates.captain_player_id = captain_player_id;

    await survey.update(updates);
    return res.status(200).send({ message: 'Estado de encuesta actualizado.', survey });
  } catch (error) {
    next(error);
  }
};

// 5. Get Surveys for Team (Coach/Admin)
exports.getTeamSurveys = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const surveys = await Survey.findAll({
      where: { equipoId: teamId },
      include: [
        { model: SurveyQuestion, as: 'questions', attributes: ['id'] },
        { model: Player, as: 'captain', attributes: ['player_id', 'player_name', 'apellidos'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Compute participation statistics for each survey
    const teamPlayersCount = await Player.count({
      where: {
        equipoId: teamId,
        status: { [Op.in]: ['REGISTERED', 'ACTIVE', 'INVITED', 'PRESELECTED'] }
      }
    });

    const enrichedSurveys = await Promise.all(
      surveys.map(async (s) => {
        const submitted = await SurveyResponse.count({
          where: { survey_id: s.id, status: 'SUBMITTED' }
        });
        const drafts = await SurveyResponse.count({
          where: { survey_id: s.id, status: 'DRAFT' }
        });
        return {
          ...s.toJSON(),
          totalPlayers: teamPlayersCount,
          submittedResponses: submitted,
          draftResponses: drafts
        };
      })
    );

    return res.status(200).send(enrichedSurveys);
  } catch (error) {
    next(error);
  }
};

// 6. Get Survey Details & Responses Roster (Coach/Admin)
exports.getSurveyAdminDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await Survey.findByPk(id, {
      include: [
        { model: SurveyQuestion, as: 'questions' },
        { model: Equipo, as: 'equipo', attributes: ['id', 'nombre'] },
        { model: Player, as: 'captain', attributes: ['player_id', 'player_name', 'apellidos', 'dorsal'] }
      ],
      order: [[{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']]
    });

    if (!survey) {
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    // Get all team players and their response status
    const players = await Player.findAll({
      where: { equipoId: survey.equipoId },
      include: [
        {
          model: SurveyResponse,
          as: 'surveyResponses',
          where: { survey_id: id },
          required: false
        }
      ],
      order: [['player_name', 'ASC']]
    });

    const participation = players.map(p => {
      const response = p.surveyResponses && p.surveyResponses.length > 0 ? p.surveyResponses[0] : null;
      return {
        player_id: p.player_id,
        name: p.player_name,
        apellidos: p.apellidos,
        dorsal: p.dorsal,
        status: p.status,
        hasAccount: !!p.mainUser,
        isCaptain: survey.captain_player_id === p.player_id,
        responseStatus: response ? response.status : 'NOT_STARTED',
        responseId: response ? response.id : null,
        submittedAt: response ? response.submitted_at : null,
        answers: response ? response.answers : null
      };
    });

    return res.status(200).send({
      survey,
      participation
    });
  } catch (error) {
    next(error);
  }
};

// 7. Reopen an individual response (Coach/Admin)
exports.reopenResponse = async (req, res, next) => {
  try {
    const { id, playerId } = req.params;

    const response = await SurveyResponse.findOne({
      where: { survey_id: id, player_id: playerId }
    });

    if (!response) {
      return res.status(404).send({ message: 'Respuesta no encontrada para esta jugadora.' });
    }

    await response.update({
      status: 'DRAFT',
      submitted_at: null
    });

    return res.status(200).send({
      message: 'Respuesta reabierta. La jugadora podrá volver a editar y enviar su formulario.'
    });
  } catch (error) {
    next(error);
  }
};

// 8. Player: Get my surveys (Authenticated Player)
exports.getMySurveys = async (req, res, next) => {
  try {
    const userId = req.userId;

    const player = await Player.findOne({ where: { mainUser: userId } });
    if (!player) {
      return res.status(404).send({ message: 'No tienes un perfil de jugadora vinculado.' });
    }

    const surveys = await Survey.findAll({
      where: {
        equipoId: player.equipoId,
        status: { [Op.in]: ['OPEN', 'CLOSED'] }
      },
      include: [
        {
          model: SurveyResponse,
          as: 'responses',
          where: { player_id: player.player_id },
          required: false
        },
        {
          model: SurveyQuestion,
          as: 'questions',
          attributes: ['id']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const result = surveys.map(s => {
      const resp = s.responses && s.responses.length > 0 ? s.responses[0] : null;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        results_published: s.results_published,
        questionCount: s.questions ? s.questions.length : 0,
        myResponseStatus: resp ? resp.status : 'NOT_STARTED',
        submittedAt: resp ? resp.submitted_at : null,
        updatedAt: resp ? resp.updatedAt : null
      };
    });

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};

// 9. Player: Get Survey Form and Draft (Authenticated Player)
exports.getSurveyForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const player = await Player.findOne({ where: { mainUser: userId } });
    if (!player) {
      return res.status(403).send({ message: 'No tienes permisos de jugadora.' });
    }

    const survey = await Survey.findOne({
      where: { id, equipoId: player.equipoId },
      include: [
        {
          model: SurveyQuestion,
          as: 'questions'
        }
      ],
      order: [[{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']]
    });

    if (!survey) {
      return res.status(404).send({ message: 'Encuesta no disponible.' });
    }

    const existingResponse = await SurveyResponse.findOne({
      where: { survey_id: id, player_id: player.player_id }
    });

    const teammates = await Player.findAll({
      where: {
        equipoId: player.equipoId,
        player_name: { [Op.ne]: 'Rival' }
      },
      attributes: ['player_id', 'player_name', 'apellidos', 'dorsal'],
      order: [['dorsal', 'ASC'], ['player_name', 'ASC']]
    });

    return res.status(200).send({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        results_published: survey.results_published,
        questions: survey.questions
      },
      myResponse: existingResponse ? {
        status: existingResponse.status,
        answers: existingResponse.answers,
        submitted_at: existingResponse.submitted_at
      } : null,
      teammates: teammates.map(t => ({
        id: t.player_id,
        name: `${t.player_name} ${t.apellidos || ''}`.trim(),
        dorsal: t.dorsal
      }))
    });
  } catch (error) {
    next(error);
  }
};

// 10. Player: Save Draft (Authenticated Player)
exports.saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    const player = await Player.findOne({ where: { mainUser: userId } });
    if (!player) {
      return res.status(403).send({ message: 'Perfil de jugadora no encontrado.' });
    }

    const survey = await Survey.findByPk(id);
    if (!survey || survey.equipoId !== player.equipoId) {
      return res.status(404).send({ message: 'Encuesta no válida.' });
    }

    let response = await SurveyResponse.findOne({
      where: { survey_id: id, player_id: player.player_id }
    });

    if (response && response.status === 'SUBMITTED') {
      return res.status(400).send({ message: 'La respuesta ya ha sido enviada de forma definitiva y no puede modificarse.' });
    }

    if (!response) {
      response = await SurveyResponse.create({
        survey_id: id,
        player_id: player.player_id,
        user_id: userId,
        status: 'DRAFT',
        answers: answers || {}
      });
    } else {
      await response.update({
        answers: answers || {},
        user_id: userId
      });
    }

    return res.status(200).send({
      message: 'Borrador guardado correctamente.',
      response
    });
  } catch (error) {
    next(error);
  }
};

// 11. Player: Submit Final Response (Authenticated Player)
exports.submitResponse = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    const player = await Player.findOne({ where: { mainUser: userId }, transaction: t });
    if (!player) {
      await t.rollback();
      return res.status(403).send({ message: 'Perfil de jugadora no encontrado.' });
    }

    const survey = await Survey.findOne({
      where: { id, equipoId: player.equipoId },
      include: [{ model: SurveyQuestion, as: 'questions' }],
      transaction: t
    });

    if (!survey) {
      await t.rollback();
      return res.status(404).send({ message: 'Encuesta no disponible.' });
    }

    if (survey.status !== 'OPEN') {
      await t.rollback();
      return res.status(400).send({ message: 'La encuesta no está abierta para recibir respuestas.' });
    }

    // Check existing response
    let response = await SurveyResponse.findOne({
      where: { survey_id: id, player_id: player.player_id },
      transaction: t
    });

    if (response && response.status === 'SUBMITTED') {
      await t.rollback();
      return res.status(409).send({ message: 'Ya has enviado tu respuesta final para esta encuesta.' });
    }

    // Validate required questions
    for (const q of survey.questions) {
      if (q.required) {
        const val = answers ? answers[q.id] : undefined;
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          await t.rollback();
          return res.status(400).send({ message: `La pregunta "${q.title}" es obligatoria.` });
        }
      }
    }

    if (!response) {
      response = await SurveyResponse.create({
        survey_id: id,
        player_id: player.player_id,
        user_id: userId,
        status: 'SUBMITTED',
        answers: answers || {},
        submitted_at: new Date()
      }, { transaction: t });
    } else {
      await response.update({
        answers: answers || {},
        status: 'SUBMITTED',
        submitted_at: new Date(),
        user_id: userId
      }, { transaction: t });
    }

    await t.commit();

    return res.status(200).send({
      message: '¡Respuesta enviada con éxito! Gracias por tu colaboración.',
      response
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 12. Player: Get Restricted Results (Captain + Competitiveness Pie Chart)
exports.getPlayerResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const player = await Player.findOne({ where: { mainUser: userId } });
    if (!player) {
      return res.status(403).send({ message: 'Perfil de jugadora no encontrado.' });
    }

    const survey = await Survey.findByPk(id, {
      include: [
        { model: SurveyQuestion, as: 'questions' },
        { model: Player, as: 'captain', attributes: ['player_id', 'player_name', 'apellidos'] }
      ]
    });

    if (!survey || survey.equipoId !== player.equipoId) {
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    if (!survey.results_published) {
      return res.status(403).send({ message: 'Los resultados aún no han sido publicados por el entrenador.' });
    }

    // 1. Calculate Competitiveness distribution (Pie chart data)
    const compSingleChoice = survey.questions.find(q =>
      q.type === 'SINGLE_CHOICE' && (/competitiv/i.test(q.title) || /exigencia/i.test(q.title))
    );
    const scaleQuestion = survey.questions.find(q => q.type === 'SCALE');

    const responses = await SurveyResponse.findAll({
      where: { survey_id: id, status: 'SUBMITTED' }
    });

    let pieChartData = [];
    let chartQuestionTitle = 'Nivel de exigencia y competitividad del equipo';

    if (compSingleChoice) {
      chartQuestionTitle = compSingleChoice.title;
      const counts = {};
      responses.forEach(r => {
        const val = r.answers ? r.answers[compSingleChoice.id] : null;
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      pieChartData = Object.keys(counts).map(k => ({
        name: k,
        value: counts[k]
      }));
    } else if (scaleQuestion) {
      chartQuestionTitle = scaleQuestion.title;
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      responses.forEach(r => {
        const val = r.answers ? r.answers[scaleQuestion.id] : null;
        if (val && counts[val] !== undefined) counts[val]++;
      });
      const labels = {
        1: '1 - Relajado / Social',
        2: '2 - Moderado',
        3: '3 - Equilibrado',
        4: '4 - Competitivo',
        5: '5 - Alta exigencia'
      };
      pieChartData = Object.keys(counts).map(k => ({
        name: labels[k] || `Nivel ${k}`,
        value: counts[k]
      })).filter(item => item.value > 0);
    }

    // 2. Calculate Captain nomination distribution (Pie chart data)
    const captainQuestion = survey.questions.find(q =>
      q.type === 'SINGLE_CHOICE' && /capitan/i.test(q.title)
    );
    let captainPieChart = [];
    if (captainQuestion) {
      const captainCounts = {};
      responses.forEach(r => {
        const val = r.answers ? r.answers[captainQuestion.id] : null;
        if (val) {
          captainCounts[val] = (captainCounts[val] || 0) + 1;
        }
      });
      captainPieChart = Object.keys(captainCounts).map(k => ({
        name: k,
        value: captainCounts[k]
      })).sort((a, b) => b.value - a.value);
    }

    // 3. Retrieve Captain answers if captain is designated
    let captainAnswers = null;
    if (survey.captain_player_id) {
      const captainResponse = await SurveyResponse.findOne({
        where: { survey_id: id, player_id: survey.captain_player_id, status: 'SUBMITTED' }
      });
      if (captainResponse) {
        captainAnswers = {
          captainName: survey.captain ? `${survey.captain.player_name} ${survey.captain.apellidos || ''}`.trim() : 'Capitana',
          answers: survey.questions.map(q => ({
            questionId: q.id,
            title: q.title,
            type: q.type,
            answer: captainResponse.answers ? captainResponse.answers[q.id] : null
          }))
        };
      }
    }

    return res.status(200).send({
      surveyTitle: survey.title,
      chartQuestionTitle,
      competitivenessPieChart: pieChartData,
      captainPieChart: captainPieChart,
      totalResponses: responses.length,
      captainData: captainAnswers
    });
  } catch (error) {
    next(error);
  }
};

// 13. Export Survey Results to Excel (Coach/Admin)
exports.exportExcel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await Survey.findByPk(id, {
      include: [
        { model: SurveyQuestion, as: 'questions' },
        { model: Equipo, as: 'equipo', attributes: ['id', 'nombre'] }
      ],
      order: [[{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']]
    });

    if (!survey) {
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    const responses = await SurveyResponse.findAll({
      where: { survey_id: id },
      include: [
        { model: Player, as: 'player', attributes: ['player_id', 'player_name', 'apellidos', 'dorsal'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PIPE STATS';
    workbook.created = new Date();

    // Sheet 1: Respuestas
    const sheetResp = workbook.addWorksheet('Respuestas');
    const columns = [
      { header: 'Jugadora', key: 'jugadora', width: 25 },
      { header: 'Apellidos', key: 'apellidos', width: 25 },
      { header: 'Dorsal', key: 'dorsal', width: 10 },
      { header: 'Estado Respuesta', key: 'estado', width: 16 },
      { header: 'Fecha Envío', key: 'fecha_envio', width: 20 },
      ...survey.questions.map(q => ({
        header: q.title,
        key: `q_${q.id}`,
        width: 30
      }))
    ];
    sheetResp.columns = columns;

    responses.forEach(r => {
      const rowData = {
        jugadora: r.player ? r.player.player_name : 'Anónimo',
        apellidos: r.player ? r.player.apellidos || '' : '',
        dorsal: r.player ? r.player.dorsal || '' : '',
        estado: r.status === 'SUBMITTED' ? 'Enviada' : 'Borrador',
        fecha_envio: r.submitted_at ? new Date(r.submitted_at).toLocaleString('es-ES') : ''
      };

      survey.questions.forEach(q => {
        const val = r.answers ? r.answers[q.id] : '';
        if (Array.isArray(val)) {
          rowData[`q_${q.id}`] = val.join(', ');
        } else if (typeof val === 'object' && val !== null) {
          rowData[`q_${q.id}`] = JSON.stringify(val);
        } else {
          rowData[`q_${q.id}`] = val !== undefined && val !== null ? String(val) : '';
        }
      });

      sheetResp.addRow(rowData);
    });

    // Style header row
    sheetResp.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetResp.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A154B' } // Purple palette
    };

    // Sheet 2: Resumen
    const sheetSummary = workbook.addWorksheet('Resumen');
    sheetSummary.columns = [
      { header: 'Métrica / Pregunta', key: 'metrica', width: 45 },
      { header: 'Opción / Valor', key: 'opcion', width: 35 },
      { header: 'Total Respuestas', key: 'conteo', width: 20 }
    ];

    sheetSummary.addRow({ metrica: 'Total Respuestas Recibidas', opcion: '-', conteo: responses.filter(r => r.status === 'SUBMITTED').length });
    sheetSummary.addRow({ metrica: 'Borradores en curso', opcion: '-', conteo: responses.filter(r => r.status === 'DRAFT').length });
    sheetSummary.addRow({}); // empty line

    // Frequency tables for choice questions
    survey.questions.forEach(q => {
      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SCALE', 'YES_NO'].includes(q.type)) {
        sheetSummary.addRow({ metrica: `--- ${q.title} ---`, opcion: '', conteo: '' });
        const freqs = {};
        responses.filter(r => r.status === 'SUBMITTED').forEach(r => {
          const val = r.answers ? r.answers[q.id] : null;
          if (Array.isArray(val)) {
            val.forEach(v => freqs[v] = (freqs[v] || 0) + 1);
          } else if (val !== null && val !== undefined) {
            freqs[val] = (freqs[val] || 0) + 1;
          }
        });
        Object.keys(freqs).forEach(k => {
          sheetSummary.addRow({ metrica: '', opcion: k, conteo: freqs[k] });
        });
        sheetSummary.addRow({});
      }
    });

    sheetSummary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheetSummary.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A154B' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="encuesta_${id}_resultados.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// 14. Export Survey Results to CSV (Coach/Admin)
exports.exportCsv = async (req, res, next) => {
  try {
    const { id } = req.params;

    const survey = await Survey.findByPk(id, {
      include: [{ model: SurveyQuestion, as: 'questions' }],
      order: [[{ model: SurveyQuestion, as: 'questions' }, 'order', 'ASC']]
    });

    if (!survey) {
      return res.status(404).send({ message: 'Encuesta no encontrada.' });
    }

    const responses = await SurveyResponse.findAll({
      where: { survey_id: id },
      include: [
        { model: Player, as: 'player', attributes: ['player_id', 'player_name', 'apellidos', 'dorsal'] }
      ]
    });

    function escapeCsv(str) {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    }

    const headers = [
      'Jugadora',
      'Apellidos',
      'Dorsal',
      'Estado',
      'Fecha_Envio',
      ...survey.questions.map(q => q.title)
    ];

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += headers.map(escapeCsv).join(';') + '\n';

    responses.forEach(r => {
      const row = [
        r.player ? r.player.player_name : 'Anónimo',
        r.player ? r.player.apellidos || '' : '',
        r.player ? r.player.dorsal || '' : '',
        r.status === 'SUBMITTED' ? 'Enviada' : 'Borrador',
        r.submitted_at ? new Date(r.submitted_at).toLocaleString('es-ES') : ''
      ];

      survey.questions.forEach(q => {
        const val = r.answers ? r.answers[q.id] : '';
        if (Array.isArray(val)) {
          row.push(val.join(', '));
        } else if (typeof val === 'object' && val !== null) {
          row.push(JSON.stringify(val));
        } else {
          row.push(val !== undefined && val !== null ? String(val) : '');
        }
      });

      csvContent += row.map(escapeCsv).join(';') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="encuesta_${id}_resultados.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
