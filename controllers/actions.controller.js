const db = require('../model');
const actionRating = db.actionRating;
const actionType = db.actionType;
const actionsRegister = db.actionRegister;

/**
 * GET handler: return all action ratings and action types as JSON.
 * Response shape: { actionRatings: [...], actionTypes: [...] }
 */
exports.get = async (req, res, next) => {
	try {
		// Fetch only required columns
		const [ratings, types] = await Promise.all([
			actionRating.findAll({ attributes: ['id', 'symbol', 'label', 'description', 'action_type_id'], order: [['id', 'ASC']] }),
			actionType.findAll({ attributes: ['id', 'code', 'name'], order: [['id', 'ASC']] })
		]);

		// Convert types to plain objects and build a lookup
		const typesPlain = types.map(t => (typeof t.toJSON === 'function') ? t.toJSON() : t);
		const typesById = {};
		typesPlain.forEach(t => { typesById[t.id] = t; });

		// Group ratings by action_type_id and trim fields
		const ratingsPlain = ratings.map(r => (typeof r.toJSON === 'function') ? r.toJSON() : r);
		const ratingsByType = {};
		ratingsPlain.forEach(r => {
			const typeId = r.action_type_id;
			if (!ratingsByType[typeId]) ratingsByType[typeId] = [];
			ratingsByType[typeId].push({ id: r.id, symbol: r.symbol, label: r.label, description: r.description });
		});

		// Build groups: one per actionType (includes types with zero ratings)
		const groups = typesPlain.map(t => ({ actionType: t, ratings: ratingsByType[t.id] || [] }));

		return res.status(200).json({ groups });
	} catch (err) {
		console.error('Error fetching actions:', err);
		next(errObj);
	}
};

exports.post = async (req, res, next) => {
	try {
		const body = req.body;
		console.log('Request body (type):', typeof body, Array.isArray(body) ? 'array' : 'object');

		// Accept either a single object or an array of objects
		const items = Array.isArray(body) ? body : [body || {}];

		const createdRows = [];

		for (const item of items) {
			// Normalize field names from different client shapes
			const action_type_id = item.action_type_id ?? item.actionTypeId ?? item.actionType ?? item.action_type ?? null;
			const rating_id = item.rating_id ?? item.ratingId ?? item.rating ?? item.rating_id ?? null;
			const player_id = item.player_id ?? item.playerId ?? item.player ?? null;
			const match_id = item.matchId ?? item.match_id ?? item.match ?? null;
			const team_id = item.team_id ?? item.teamId ?? item.team ?? null;
			const timestamp_in_set = item.timestamp ?? item.timestamp_in_set ?? null; // map to model field
			const eventId = item.eventId ?? item.matchEventId ?? item.event_id ?? null;
			const description = item.description ?? null;
			const extra = item.extra ?? null;

			// Basic validation
			if (action_type_id == null || rating_id == null) {
				return res.status(400).send({ message: `action_type_id and rating_id are required for each item. Received: action_type_id=${action_type_id}, rating_id=${rating_id}` });
			}

			const normalizedActionTypeId = Number(action_type_id);
			const normalizedRatingId = Number(rating_id);
			const normalizedPlayerId = player_id != null ? Number(player_id) : null;
			const normalizedMatchId = match_id != null ? Number(match_id) : null;
			const normalizedTeamId = team_id != null ? Number(team_id) : null;

			if (!Number.isInteger(normalizedActionTypeId) || !Number.isInteger(normalizedRatingId)) {
				return res.status(400).send({ message: 'action_type_id and rating_id must be integers' });
			}

			if (normalizedTeamId == null || !Number.isInteger(normalizedTeamId)) {
				return res.status(400).send({ message: 'team_id is required and must be an integer' });
			}

			const [actionTypeExists, ratingExists, teamExists] = await Promise.all([
				actionType.findByPk(normalizedActionTypeId, { attributes: ['id'] }),
				actionRating.findByPk(normalizedRatingId, { attributes: ['id', 'action_type_id'] }),
				db.equipo.findByPk(normalizedTeamId, { attributes: ['id'] }),
			]);

			if (!actionTypeExists) {
				return res.status(400).send({ message: `Invalid action_type_id: ${normalizedActionTypeId}` });
			}

			if (!ratingExists) {
				return res.status(400).send({ message: `Invalid rating_id: ${normalizedRatingId}` });
			}

			if (Number(ratingExists.action_type_id) !== normalizedActionTypeId) {
				return res.status(400).send({ message: 'rating_id does not belong to the provided action_type_id' });
			}

			if (!teamExists) {
				return res.status(400).send({ message: `Invalid team_id: ${normalizedTeamId}` });
			}

			if (normalizedPlayerId != null) {
				if (!Number.isInteger(normalizedPlayerId)) {
					return res.status(400).send({ message: 'player_id must be an integer' });
				}

				const playerExists = await db.players.findByPk(normalizedPlayerId, { attributes: ['player_id'] });
				if (!playerExists) {
					return res.status(400).send({ message: `Invalid player_id: ${normalizedPlayerId}` });
				}
			}

			if (normalizedMatchId != null) {
				if (!Number.isInteger(normalizedMatchId)) {
					return res.status(400).send({ message: 'match_id must be an integer' });
				}

				const matchExists = await db.partido.findByPk(normalizedMatchId, { attributes: ['id'] });
				if (!matchExists) {
					return res.status(400).send({ message: `Invalid match_id: ${normalizedMatchId}` });
				}
			}

			// Build payload matching model column names
			const payload = {
				action_type_id: normalizedActionTypeId,
				rating_id: normalizedRatingId,
				player_id: normalizedPlayerId,
				match_id: normalizedMatchId,
				team_id: normalizedTeamId,
				timestamp_in_set: timestamp_in_set != null ? Number(timestamp_in_set) : 0,
				// optional fields
				description,
				extra,
			};

			console.log('Creating action register with payload:', payload);

			const created = await actionsRegister.create(payload);
			createdRows.push(created);
		}

		// Respond with created row(s)
		if (createdRows.length === 1) return res.status(201).json(createdRows[0]);
		return res.status(201).json(createdRows);
	} catch (err) {
		console.error('Error creating action register:', err);
		next(errObj);
	}
};
exports.getSaques = async (req, res, next) => {
	const matchId = Number(req.params.matchId);

	try {
		if (isNaN(matchId)) return res.status(400).send({ message: 'Invalid matchId' });

		// total rows where match_id = matchId and action_type_id = 4
		const total = await actionsRegister.count({ where: { match_id: matchId, action_type_id: 1 } });

		// grouped counts by symbol via join with action_ratings
		const sql = `
			SELECT ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			WHERE r.match_id = :matchId AND r.action_type_id = 1
			GROUP BY ar.symbol
			ORDER BY cnt DESC
		`;

		const results = await db.sequelize.query(sql, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// normalize results into a map symbol -> count
		const bySymbol = {};
		results.forEach((row) => {
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			bySymbol[sym] = cnt;
		});

		// Also compute per-player counts grouped by player_id and symbol
		const sqlPlayer = `
			SELECT r.player_id AS player_id, p.player_name AS player_name, ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			LEFT JOIN players p ON r.player_id = p.player_id
			WHERE r.match_id = :matchId AND r.action_type_id = 1
			GROUP BY r.player_id, p.player_name, ar.symbol
			ORDER BY r.player_id, cnt DESC
		`;

		const playerRows = await db.sequelize.query(sqlPlayer, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// build nested map: player_id -> { player_name, symbols: { symbol -> count } }
		const perPlayer = {};
		playerRows.forEach((row) => {
			const pid = row.player_id == null ? 'unknown' : String(row.player_id);
			const name = row.player_name ?? null;
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			if (!perPlayer[pid]) perPlayer[pid] = { player_name: name, symbols: {} };
			perPlayer[pid].symbols[sym] = cnt;
		});

		return res.status(200).json({ matchId, action_type_id: 1, total, bySymbol, breakdown: results, perPlayer, perPlayerBreakdown: playerRows });
	} catch (err) {
		console.error('Error in getSaques:', err);
		next(errObj);
	}
};
exports.getReces = async (req, res, next) => {
	const matchId = Number(req.params.matchId);

	try {
		if (isNaN(matchId)) return res.status(400).send({ message: 'Invalid matchId' });

		// total rows where match_id = matchId and action_type_id = 4
		const total = await actionsRegister.count({ where: { match_id: matchId, action_type_id: 2 } });

		// grouped counts by symbol via join with action_ratings
		const sql = `
			SELECT ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			WHERE r.match_id = :matchId AND r.action_type_id = 2
			GROUP BY ar.symbol
			ORDER BY cnt DESC
		`;

		const results = await db.sequelize.query(sql, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// normalize results into a map symbol -> count
		const bySymbol = {};
		results.forEach((row) => {
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			bySymbol[sym] = cnt;
		});

		// Also compute per-player counts grouped by player_id and symbol
		const sqlPlayer = `
			SELECT r.player_id AS player_id, p.player_name AS player_name, pos.position_name AS position_name, ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			LEFT JOIN players p ON r.player_id = p.player_id
			LEFT JOIN positions pos ON p.position_id = pos.position_id
			WHERE r.match_id = :matchId AND r.action_type_id = 2
			GROUP BY r.player_id, p.player_name, pos.position_name, ar.symbol
			ORDER BY r.player_id, cnt DESC
		`;

		const playerRows = await db.sequelize.query(sqlPlayer, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// build nested map: player_id -> { player_name, symbols: { symbol -> count } }
		const perPlayer = {};
		playerRows.forEach((row) => {
			const pid = row.player_id == null ? 'unknown' : String(row.player_id);
			const name = row.player_name ?? null;
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			if (!perPlayer[pid]) perPlayer[pid] = { player_name: name, symbols: {} };
			perPlayer[pid].symbols[sym] = cnt;
		});

		return res.status(200).json({ matchId, action_type_id: 2, total, bySymbol, breakdown: results, perPlayer, perPlayerBreakdown: playerRows });
	} catch (err) {
		console.error('Error in getSaques:', err);
		next(errObj);
	}
};
exports.getAtaques = async (req, res, next) => {
const matchId = Number(req.params.matchId);

	try {
		if (isNaN(matchId)) return res.status(400).send({ message: 'Invalid matchId' });

		// total rows where match_id = matchId and action_type_id = 4
		const total = await actionsRegister.count({ where: { match_id: matchId, action_type_id: 3 } });

		// grouped counts by symbol via join with action_ratings
		const sql = `
			SELECT ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			WHERE r.match_id = :matchId AND r.action_type_id = 3
			GROUP BY ar.symbol
			ORDER BY cnt DESC
		`;

		const results = await db.sequelize.query(sql, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// normalize results into a map symbol -> count
		const bySymbol = {};
		results.forEach((row) => {
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			bySymbol[sym] = cnt;
		});

		// Also compute per-player counts grouped by player_id and symbol
		const sqlPlayer = `
			SELECT r.player_id AS player_id, p.player_name AS player_name, ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			LEFT JOIN players p ON r.player_id = p.player_id
			WHERE r.match_id = :matchId AND r.action_type_id = 3
			GROUP BY r.player_id, p.player_name, ar.symbol
			ORDER BY r.player_id, cnt DESC
		`;

		const playerRows = await db.sequelize.query(sqlPlayer, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// build nested map: player_id -> { player_name, symbols: { symbol -> count } }
		const perPlayer = {};
		playerRows.forEach((row) => {
			const pid = row.player_id == null ? 'unknown' : String(row.player_id);
			const name = row.player_name ?? null;
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			if (!perPlayer[pid]) perPlayer[pid] = { player_name: name, symbols: {} };
			perPlayer[pid].symbols[sym] = cnt;
		});

		return res.status(200).json({ matchId, action_type_id: 3, total, bySymbol, breakdown: results, perPlayer, perPlayerBreakdown: playerRows });
	} catch (err) {
		console.error('Error in getSaques:', err);
		next(errObj);
	}
}
exports.getColocaciones = async (req, res, next) => {
	const matchId = Number(req.params.matchId);

	try {
		if (isNaN(matchId)) return res.status(400).send({ message: 'Invalid matchId' });

		// total rows where match_id = matchId and action_type_id = 4
		const total = await actionsRegister.count({ where: { match_id: matchId, action_type_id: 4 } });

		// grouped counts by symbol via join with action_ratings
		const sql = `
			SELECT ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			WHERE r.match_id = :matchId AND r.action_type_id = 4
			GROUP BY ar.symbol
			ORDER BY cnt DESC
		`;

		const results = await db.sequelize.query(sql, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// normalize results into a map symbol -> count
		const bySymbol = {};
		results.forEach((row) => {
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			bySymbol[sym] = cnt;
		});

		// Also compute per-player counts grouped by player_id and symbol
		const sqlPlayer = `
			SELECT r.player_id AS player_id, p.player_name AS player_name, ar.symbol AS symbol, COUNT(*) AS cnt
			FROM action_registers r
			JOIN action_ratings ar ON r.rating_id = ar.id
			LEFT JOIN players p ON r.player_id = p.player_id
			WHERE r.match_id = :matchId AND r.action_type_id = 4
			GROUP BY r.player_id, p.player_name, ar.symbol
			ORDER BY r.player_id, cnt DESC
		`;

		const playerRows = await db.sequelize.query(sqlPlayer, {
			replacements: { matchId },
			type: db.Sequelize.QueryTypes.SELECT,
		});

		// build nested map: player_id -> { player_name, symbols: { symbol -> count } }
		const perPlayer = {};
		playerRows.forEach((row) => {
			const pid = row.player_id == null ? 'unknown' : String(row.player_id);
			const name = row.player_name ?? null;
			const sym = row.symbol ?? 'unknown';
			const cnt = Number(row.cnt || 0);
			if (!perPlayer[pid]) perPlayer[pid] = { player_name: name, symbols: {} };
			perPlayer[pid].symbols[sym] = cnt;
		});

		return res.status(200).json({ matchId, action_type_id: 4, total, bySymbol, breakdown: results, perPlayer, perPlayerBreakdown: playerRows });
	} catch (err) {
		console.error('Error in getSaques:', err);
		next(errObj);
	}
}