process.env.NODE_ENV = 'production';
const db = require('../model');

async function seedSurvey1() {
  console.log('--- Seeding Survey 1 Questions ---');
  const survey = await db.surveys.findByPk(1);
  if (!survey) {
    console.error('Survey 1 not found');
    process.exit(1);
  }

  // Clear any existing questions for survey 1
  await db.surveyQuestions.destroy({ where: { survey_id: 1 } });

  const questions = [
    {
      survey_id: 1,
      title: '¿Quién crees que debería ser la capitana del equipo?',
      description: 'Vota a una compañera de equipo para asumir la capitanía esta temporada.',
      type: 'SINGLE_CHOICE',
      required: true,
      order: 1,
      options: [
        'Blanca Guarinos Beato (#1)',
        'Safia Pérez Mora (#3)',
        'Cristina Falcón Pérez (#4)',
        'Inma Jurado (#5)',
        'Fati Vazquez (#6)',
        'Mariló Payer Pérez (#7)',
        'Marina Vizuete Sánchez (#8)',
        'Ana Leal Díaz (#9)',
        'Izzy Fernández Morales (#10)',
        'Aroa Millán Prieto (#11)',
        'Verónica Tirado García (#12)',
        'Rocío Bermejo Pérez (#13)',
        'Vera Ferrete Collantes (#14)',
        'Paula Lupiani (#15)',
        'Elena Baron (#18)',
        'Olga Tejada Vega (#21)',
        'Paula Sosa Hernández (#22)',
        'Camilla Garagna (#97)'
      ]
    },
    {
      survey_id: 1,
      title: '¿Qué nivel de exigencia y competitividad buscas para esta temporada?',
      description: 'Elige la opción que mejor represente tu ambición con el equipo.',
      type: 'SINGLE_CHOICE',
      required: true,
      order: 2,
      options: [
        'Máxima competición: Entrenar a tope y pelear por ganar y estar arriba',
        'Competición y mejora: Subir el nivel del equipo y competir cada partido con exigencia',
        'Equilibrado: Aprender, competir y pasarlo bien sin obsesión por el resultado',
        'Lúdico y formativo: Disfrutar del voleibol, hacer grupo y jugar sin presión'
      ]
    },
    {
      survey_id: 1,
      title: '¿Qué te hace seguir jugando al voleibol?',
      description: 'Selecciona todas las razones que te motivan.',
      type: 'MULTIPLE_CHOICE',
      required: true,
      order: 3,
      options: [
        'Mejorar mi nivel y crecer técnicamente',
        'Competir y ganar partidos',
        'Hacer vestuario y sentir la unión del grupo',
        'Desconectar de la rutina y el estrés',
        'Estar con mis compañeras y amigas',
        'Sentirme en forma y activa físicamente',
        'El ambiente y la emoción de los partidos de fin de semana'
      ]
    },
    {
      survey_id: 1,
      title: 'Al terminar la temporada, me gustaría poder decir que…',
      description: 'Expresa tu objetivo o visión personal para el final de curso.',
      type: 'LONG_TEXT',
      required: true,
      order: 4
    },
    {
      survey_id: 1,
      title: 'Ordena estas prioridades para la temporada, de mayor a menor importancia.',
      description: 'Usa los botones para ordenar de más prioritario (arriba) a menos (abajo).',
      type: 'RANKING',
      required: true,
      order: 5,
      options: [
        'Mejorar el nivel de juego colectivo',
        'Competir con garra y actitud cada punto',
        'Lograr la mejor posición clasificatoria posible',
        'Mantener un vestuario unido, sano y positivo',
        'Disfrutar al máximo de los entrenamientos'
      ]
    },
    {
      survey_id: 1,
      title: '¿Qué equilibrio te gustaría que hubiera entre exigencia y disfrute?',
      description: 'Valora del 1 (Relajado) al 5 (Máxima exigencia).',
      type: 'SCALE',
      required: true,
      order: 6,
      config: { min: 1, max: 5, minLabel: '1 - Relajado y social', maxLabel: '5 - Máxima exigencia y foco competitivo' }
    },
    {
      survey_id: 1,
      title: '¿Qué no deberíamos perder nunca como equipo, incluso en semanas difíciles o tras una derrota?',
      description: 'Los valores innegociables que nos deben definir.',
      type: 'LONG_TEXT',
      required: false,
      order: 7
    }
  ];

  for (const q of questions) {
    await db.surveyQuestions.create(q);
  }

  console.log(`✓ Successfully seeded ${questions.length} questions for Survey 1.`);
  process.exit(0);
}

seedSurvey1().catch(err => {
  console.error('Error seeding survey 1:', err);
  process.exit(1);
});
