const db = require('../model');
const Anotaciones = db.anotaciones;

// Create and Save a new Anotacion
exports.create = async (req, res, next) => {
  try {
    const payload = req.body || {};
    console.log('Payload description:', payload.description);
    const created = await Anotaciones.create({
      annotation_id: payload.id || payload.annotation_id || null,
      type: payload.type,
      timestamp: payload.timestamp ?? 0,
      visible: payload.visible ?? true,
      color: payload.color || null,
      opacity: payload.opacity ?? 1,
      strokeWidth: payload.strokeWidth ?? null,
      data: payload.data || null,
      description: payload.description ?? (payload.data && payload.data.description) ?? null,
      source: payload.source || null,
      matchId: payload.matchId ?? null,
      eventIndex: payload.eventIndex ?? null,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating anotacion:', error);
    next(errObj);
  }
};

// Retrieve all Anotaciones
exports.findAll = async (req, res, next) => {
  try {
    const items = await Anotaciones.findAll({ order: [['createdAt', 'ASC']] });
    return res.json(items);
  } catch (error) {
    console.error('Error fetching anotaciones:', error);
    next(errObj);
  }
};

// Retrieve anotaciones by matchId
exports.findByMatch = async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    const items = await Anotaciones.findAll({ where: { matchId }, order: [['createdAt', 'ASC']] });
    return res.json(items);
  } catch (error) {
    console.error('Error fetching anotaciones by match:', error);
    next(errObj);
  }
};

// Find a single Anotacion by id
exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await Anotaciones.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Anotacion not found' });
    return res.json(item);
  } catch (error) {
    console.error('Error fetching anotacion:', error);
    next(errObj);
  }
};

// Update an Anotacion by the id in the request
exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [updatedCount] = await Anotaciones.update(req.body, { where: { id } });
    if (updatedCount === 0) return res.status(404).json({ message: 'Anotacion not found or no changes' });
    const updated = await Anotaciones.findByPk(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error updating anotacion:', error);
    next(errObj);
  }
};

// Delete an Anotacion with the specified id
exports.delete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedCount = await Anotaciones.destroy({ where: { id } });
    if (deletedCount === 0) return res.status(404).json({ message: 'Anotacion not found' });
    return res.json({ message: 'Anotacion deleted' });
  } catch (error) {
    console.error('Error deleting anotacion:', error);
    next(errObj);
  }
};

// Delete all Anotaciones
exports.deleteAll = async (req, res, next) => {
  try {
    await Anotaciones.destroy({ where: {} });
    return res.json({ message: 'All anotaciones deleted' });
  } catch (error) {
    console.error('Error deleting all anotaciones:', error);
    next(errObj);
  }
};
