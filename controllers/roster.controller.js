const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../model');
const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const Player = db.players;
const User = db.user;
const Role = db.role;
const Equipo = db.equipo;
const Position = db.positions;
const PlayerToken = db.playerTokens;
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;

// Preselected squad list according to spec
const INITIAL_PRESELECTED_PLAYERS = [
  { name: 'Olga', apellidos: 'Tejada Vega' },
  { name: 'Fátima', apellidos: 'Idzi Dorado' },
  { name: 'Inma', apellidos: '' },
  { name: 'Camilla', apellidos: '' },
  { name: 'Izzy', apellidos: '' },
  { name: 'Mariló', apellidos: '' },
  { name: 'Vero', apellidos: '' },
  { name: 'Blanca', apellidos: '' },
  { name: 'Cristina', apellidos: '' },
  { name: 'Paula', apellidos: 'Sosa' },
  { name: 'Rocío', apellidos: '' },
  { name: 'Paula', apellidos: 'Lupi' },
  { name: 'Aroa', apellidos: '' },
  { name: 'Safia', apellidos: '' },
  { name: 'Marina', apellidos: '' },
  { name: 'Ana', apellidos: '' },
  { name: 'Elena', apellidos: '' },
  { name: 'Vera', apellidos: '' }
];

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// 1. Preselect individual player (Admin/Coach)
exports.preselectPlayer = async (req, res, next) => {
  try {
    const { name, apellidos, equipoId, coach_notes, dorsal, position_id } = req.body;
    const userId = req.userId;

    if (!name || !equipoId) {
      return res.status(400).send({ message: 'Nombre y equipoId son obligatorios.' });
    }

    const player = await Player.create({
      player_name: name,
      apellidos: apellidos || null,
      dorsal: dorsal || null,
      position_id: position_id || null,
      userId: userId,
      equipoId: equipoId,
      status: 'PRESELECTED',
      coach_notes: coach_notes || null
    });

    return res.status(201).send(player);
  } catch (error) {
    next(error);
  }
};

// 2. Preselect initial roster for a team (Admin/Coach)
exports.preselectInitialRoster = async (req, res, next) => {
  try {
    const { equipoId } = req.body;
    const userId = req.userId;

    if (!equipoId) {
      return res.status(400).send({ message: 'equipoId es obligatorio.' });
    }

    const team = await Equipo.findByPk(equipoId);
    if (!team) {
      return res.status(404).send({ message: 'Equipo no encontrado.' });
    }

    // Get existing players in team
    const existing = await Player.findAll({
      where: { equipoId: equipoId },
      attributes: ['player_name', 'apellidos']
    });

    const existingNames = new Set(existing.map(p => `${p.player_name} ${p.apellidos || ''}`.trim().toLowerCase()));

    const createdPlayers = [];
    for (const p of INITIAL_PRESELECTED_PLAYERS) {
      const fullName = `${p.name} ${p.apellidos}`.trim().toLowerCase();
      if (!existingNames.has(fullName)) {
        const created = await Player.create({
          player_name: p.name,
          apellidos: p.apellidos || null,
          dorsal: null,
          position_id: null,
          userId: userId,
          equipoId: equipoId,
          status: 'PRESELECTED'
        });
        createdPlayers.push(created);
      }
    }

    return res.status(200).send({
      message: `Se han añadido ${createdPlayers.length} jugadoras preseleccionadas al equipo.`,
      players: createdPlayers
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update player (Coach)
exports.updatePlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { player_name, apellidos, dorsal, position_id, status, coach_notes } = req.body;

    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).send({ message: 'Jugadora no encontrada.' });
    }

    await player.update({
      player_name: player_name !== undefined ? player_name : player.player_name,
      apellidos: apellidos !== undefined ? apellidos : player.apellidos,
      dorsal: dorsal !== undefined ? dorsal : player.dorsal,
      position_id: position_id !== undefined ? position_id : player.position_id,
      status: status !== undefined ? status : player.status,
      coach_notes: coach_notes !== undefined ? coach_notes : player.coach_notes
    });

    return res.status(200).send({ message: 'Jugadora actualizada correctamente.', player });
  } catch (error) {
    next(error);
  }
};

// 4. Generate invitation link (Admin/Coach)
exports.generateInvitation = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const userId = req.userId;

    const player = await Player.findByPk(playerId, {
      include: [{ model: Equipo, as: 'equipo', attributes: ['nombre'] }]
    });

    if (!player) {
      return res.status(404).send({ message: 'Jugadora no encontrada.' });
    }

    // Revoke all previous active invitation tokens for this player
    await PlayerToken.update(
      { revoked_at: new Date() },
      {
        where: {
          player_id: playerId,
          type: 'INVITATION',
          used_at: null,
          revoked_at: null
        }
      }
    );

    // Generate random 32-byte hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Default duration: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await PlayerToken.create({
      player_id: playerId,
      token_hash: tokenHash,
      type: 'INVITATION',
      expires_at: expiresAt,
      created_by: userId
    });

    // Update status to INVITED if it was PRESELECTED
    if (player.status === 'PRESELECTED') {
      await player.update({ status: 'INVITED' });
    }

    const host = req.get('origin') || req.get('referer') || 'http://localhost:4200';
    const baseUrl = host.replace(/\/$/, '');
    const activationUrl = `${baseUrl}/activar-cuenta/${rawToken}`;

    const teamName = player.equipo ? player.equipo.nombre : 'Senior Femenino';
    const playerDisplayName = `${player.player_name} ${player.apellidos || ''}`.trim();
    const whatsappText = encodeURIComponent(
      `¡Hola ${playerDisplayName}! Aquí tienes tu enlace de invitación para activar tu cuenta en el equipo ${teamName}: ${activationUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    return res.status(200).send({
      message: 'Enlace de invitación generado correctamente.',
      token: rawToken,
      url: activationUrl,
      whatsappUrl: whatsappUrl,
      expiresAt: expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// 5. Generate recovery link (Admin/Coach)
exports.generateRecovery = async (req, res, next) => {
  try {
    const { playerId } = req.body;
    const userId = req.userId;

    const player = await Player.findByPk(playerId, {
      include: [{ model: Equipo, as: 'equipo', attributes: ['nombre'] }]
    });

    if (!player) {
      return res.status(404).send({ message: 'Jugadora no encontrada.' });
    }

    if (!player.mainUser) {
      return res.status(400).send({ message: 'La jugadora todavía no tiene una cuenta vinculada para recuperar.' });
    }

    // Revoke previous recovery tokens
    await PlayerToken.update(
      { revoked_at: new Date() },
      {
        where: {
          player_id: playerId,
          type: 'RECOVERY',
          used_at: null,
          revoked_at: null
        }
      }
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Default duration: 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await PlayerToken.create({
      player_id: playerId,
      token_hash: tokenHash,
      type: 'RECOVERY',
      expires_at: expiresAt,
      created_by: userId
    });

    const host = req.get('origin') || req.get('referer') || 'http://localhost:4200';
    const baseUrl = host.replace(/\/$/, '');
    const recoveryUrl = `${baseUrl}/recuperar-cuenta/${rawToken}`;

    const playerDisplayName = `${player.player_name} ${player.apellidos || ''}`.trim();
    const whatsappText = encodeURIComponent(
      `¡Hola ${playerDisplayName}! Aquí tienes tu enlace para restablecer tu contraseña en PIPE STATS: ${recoveryUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    return res.status(200).send({
      message: 'Enlace de recuperación generado correctamente.',
      token: rawToken,
      url: recoveryUrl,
      whatsappUrl: whatsappUrl,
      expiresAt: expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// 6. Revoke active token (Admin/Coach)
exports.revokeToken = async (req, res, next) => {
  try {
    const { tokenId, playerId } = req.body;

    const where = {
      used_at: null,
      revoked_at: null
    };

    if (tokenId) {
      where.id = tokenId;
    } else if (playerId) {
      where.player_id = playerId;
    } else {
      return res.status(400).send({ message: 'Debe especificar tokenId o playerId.' });
    }

    const [updatedCount] = await PlayerToken.update(
      { revoked_at: new Date() },
      { where }
    );

    return res.status(200).send({
      message: `Se han revocado ${updatedCount} enlaces activos.`
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get token info (PUBLIC)
exports.getTokenInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).send({ valid: false, message: 'Token requerido.' });
    }

    const tokenHash = hashToken(token);
    const playerToken = await PlayerToken.findOne({
      where: { token_hash: tokenHash },
      include: [
        {
          model: Player,
          as: 'player',
          include: [
            { model: Equipo, as: 'equipo', attributes: ['id', 'nombre'] },
            { model: Position, as: 'position', attributes: ['position_id', 'position_name'] }
          ]
        }
      ]
    });

    if (!playerToken) {
      return res.status(404).send({ valid: false, message: 'El enlace no existe o es inválido.' });
    }

    if (playerToken.revoked_at) {
      return res.status(410).send({ valid: false, message: 'Este enlace ha sido revocado por el administrador.' });
    }

    if (playerToken.used_at) {
      return res.status(410).send({ valid: false, message: 'Este enlace ya ha sido utilizado.' });
    }

    if (new Date(playerToken.expires_at) < new Date()) {
      return res.status(410).send({ valid: false, message: 'Este enlace ha caducado.' });
    }

    const player = playerToken.player;
    return res.status(200).send({
      valid: true,
      type: playerToken.type,
      player: {
        player_id: player.player_id,
        player_name: player.player_name,
        apellidos: player.apellidos,
        dorsal: player.dorsal,
        position_id: player.position_id,
        position_name: player.position ? player.position.position_name : null,
        equipoId: player.equipoId,
        equipoNombre: player.equipo ? player.equipo.nombre : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Activate account via unique invitation link (PUBLIC)
exports.activateAccount = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      token,
      email,
      password,
      username,
      nombre,
      apellidos,
      position_id,
      secondary_positions,
      years_playing,
      player_notes
    } = req.body;

    if (!token || !email || !password) {
      await t.rollback();
      return res.status(400).send({ message: 'Token, email y contraseña son obligatorios.' });
    }

    const tokenHash = hashToken(token);
    const playerToken = await PlayerToken.findOne({
      where: {
        token_hash: tokenHash,
        type: 'INVITATION',
        used_at: null,
        revoked_at: null
      },
      transaction: t
    });

    if (!playerToken || new Date(playerToken.expires_at) < new Date()) {
      await t.rollback();
      return res.status(400).send({ message: 'El enlace de activación es inválido o ha caducado.' });
    }

    const player = await Player.findByPk(playerToken.player_id, { transaction: t });
    if (!player) {
      await t.rollback();
      return res.status(404).send({ message: 'Perfil de jugadora no encontrado.' });
    }

    // Determine username (use provided username or default to email prefix)
    const finalUsername = username && username.trim().length > 0 
      ? username.trim().toLowerCase() 
      : email.split('@')[0].toLowerCase();

    // Check if username is already taken by another user
    const existingByUsername = await User.findOne({
      where: { username: finalUsername },
      transaction: t
    });
    if (existingByUsername && (!player.mainUser || player.mainUser !== existingByUsername.id)) {
      await t.rollback();
      return res.status(409).send({ message: `El nombre de usuario "${finalUsername}" ya está en uso. Por favor, elige otro nombre de usuario.` });
    }

    // Check if email is already taken by another user
    const existingByEmail = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      transaction: t
    });
    if (existingByEmail && (!player.mainUser || player.mainUser !== existingByEmail.id)) {
      await t.rollback();
      return res.status(409).send({ message: 'El correo electrónico ya está registrado en otra cuenta.' });
    }

    let user = existingByUsername || existingByEmail;

    if (!user) {
      // Create new user
      user = await User.create({
        username: finalUsername,
        email: email.trim().toLowerCase(),
        password: bcrypt.hashSync(password, 8)
      }, { transaction: t });

      // Assign default role 'user' (ID 1)
      await user.setRoles([1], { transaction: t });
    } else {
      // Update password during activation if reusing previously linked user
      await user.update({
        password: bcrypt.hashSync(password, 8)
      }, { transaction: t });
    }

    // Associate user with team in user_teams if team exists
    if (player.equipoId) {
      const team = await Equipo.findByPk(player.equipoId, { transaction: t });
      if (team && team.addEquipa) {
        await team.addEquipa(user.id, { transaction: t });
      }
    }

    // Update player profile
    await player.update({
      player_name: nombre || player.player_name,
      apellidos: apellidos !== undefined ? apellidos : player.apellidos,
      position_id: position_id || player.position_id,
      secondary_positions: secondary_positions || player.secondary_positions,
      years_playing: years_playing !== undefined ? years_playing : player.years_playing,
      player_notes: player_notes || player.player_notes,
      mainUser: user.id,
      status: 'REGISTERED'
    }, { transaction: t });

    // Mark token as used
    await playerToken.update({
      used_at: new Date()
    }, { transaction: t });

    await t.commit();

    // Auto-login: generate JWT token
    const jwtToken = jwt.sign({ id: user.id }, config.secret, {
      algorithm: 'HS256',
      allowInsecureKeySizes: true,
      expiresIn: 86400 // 24 hours
    });

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push('ROLE_' + roles[i].name.toUpperCase());
    }

    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).send({
      message: '¡Cuenta activada con éxito!',
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      token: jwtToken,
      player: {
        player_id: player.player_id,
        player_name: player.player_name,
        apellidos: player.apellidos,
        position_id: player.position_id,
        equipoId: player.equipoId
      }
    });

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 9. Reset password with recovery token (PUBLIC)
exports.resetPassword = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      await t.rollback();
      return res.status(400).send({ message: 'Token y nueva contraseña son obligatorios.' });
    }

    const tokenHash = hashToken(token);
    const playerToken = await PlayerToken.findOne({
      where: {
        token_hash: tokenHash,
        type: 'RECOVERY',
        used_at: null,
        revoked_at: null
      },
      transaction: t
    });

    if (!playerToken || new Date(playerToken.expires_at) < new Date()) {
      await t.rollback();
      return res.status(400).send({ message: 'El enlace de recuperación es inválido o ha caducado.' });
    }

    const player = await Player.findByPk(playerToken.player_id, { transaction: t });
    if (!player || !player.mainUser) {
      await t.rollback();
      return res.status(404).send({ message: 'Usuario vinculado a la jugadora no encontrado.' });
    }

    const user = await User.findByPk(player.mainUser, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).send({ message: 'Usuario no encontrado.' });
    }

    await user.update({
      password: bcrypt.hashSync(password, 8)
    }, { transaction: t });

    await playerToken.update({
      used_at: new Date()
    }, { transaction: t });

    await t.commit();

    return res.status(200).send({
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva clave.'
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// 10. Get my player profile (Authenticated player)
exports.getMyProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const player = await Player.findOne({
      where: { mainUser: userId },
      include: [
        { model: Equipo, as: 'equipo', attributes: ['id', 'nombre'] },
        { model: Position, as: 'position', attributes: ['position_id', 'position_name'] }
      ]
    });

    if (!player) {
      return res.status(404).send({ message: 'No tienes un perfil de jugadora vinculado a este usuario.' });
    }

    return res.status(200).send(player);
  } catch (error) {
    next(error);
  }
};

// 11. Update my player profile (Authenticated player)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { player_name, apellidos, position_id, secondary_positions, years_playing, player_notes } = req.body;

    const player = await Player.findOne({ where: { mainUser: userId } });
    if (!player) {
      return res.status(404).send({ message: 'Perfil de jugadora no encontrado.' });
    }

    await player.update({
      player_name: player_name !== undefined ? player_name : player.player_name,
      apellidos: apellidos !== undefined ? apellidos : player.apellidos,
      position_id: position_id !== undefined ? position_id : player.position_id,
      secondary_positions: secondary_positions !== undefined ? secondary_positions : player.secondary_positions,
      years_playing: years_playing !== undefined ? years_playing : player.years_playing,
      player_notes: player_notes !== undefined ? player_notes : player.player_notes
    });

    return res.status(200).send({ message: 'Perfil actualizado correctamente.', player });
  } catch (error) {
    next(error);
  }
};
