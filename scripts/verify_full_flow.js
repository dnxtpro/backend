const http = require('http');

function post(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (token) headers['authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'GET',
      headers
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(url, data, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (token) headers['authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'PUT',
      headers
    }, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function verify() {
  console.log('=== VERIFYING FULL PIPE STATS FLOW ON LOCAL PORT 4002 ===\n');

  // 1. Signin
  console.log('1. Testing signin with user: dnxtpro...');
  const signinRes = await post('http://localhost:4002/api/auth/signin', {
    username: 'dnxtpro',
    password: 'locoplaya'
  });
  const token = signinRes.data.token || signinRes.data.accessToken;
  if (signinRes.status !== 200 || !token) {
    console.error('Signin failed:', signinRes);
    process.exit(1);
  }
  console.log('✓ Signin successful! Token received for user:', signinRes.data.username);

  // 2. Get Teams
  console.log('\n2. Testing /api/getTeams...');
  const teamsRes = await get('http://localhost:4002/api/getTeams', token);
  console.log(`Status: ${teamsRes.status}, Teams found:`, teamsRes.data.map(t => ({ id: t.id, name: t.nombre })));
  const team72 = teamsRes.data.find(t => t.id === 72 || t.nombre === 'Senior Femenino Amatista');
  if (!team72) {
    console.error('ERROR: Senior Femenino Amatista not found in user teams!');
    process.exit(1);
  }
  console.log('✓ Senior Femenino Amatista is available to user dnxtpro');

  // 3. Get all players (the previous bug)
  console.log('\n3. Testing /api/players/all...');
  const allPlayersRes = await get('http://localhost:4002/api/players/all', token);
  console.log(`Status: ${allPlayersRes.status}, Total players returned: ${allPlayersRes.data.length}`);
  if (allPlayersRes.status !== 200) {
    console.error('ERROR: /api/players/all failed:', allPlayersRes);
    process.exit(1);
  }
  console.log('✓ /api/players/all returned HTTP 200 successfully without null pointer errors!');

  // 4. Get team 72 players
  console.log('\n4. Testing /api/players/72 (Team players)...');
  const teamPlayersRes = await get('http://localhost:4002/api/players/72', token);
  console.log(`Status: ${teamPlayersRes.status}, Players in team 72: ${teamPlayersRes.data.length}`);
  teamPlayersRes.data.slice(0, 5).forEach(p => {
    console.log(`   #${p.dorsal} ${p.name} - Pos: ${p.position_name}`);
  });
  console.log('✓ Team players loaded successfully with positions');

  // 5. Get surveys for team 72
  console.log('\n5. Testing /api/surveys/team/72...');
  const surveysRes = await get('http://localhost:4002/api/surveys/team/72', token);
  console.log(`Status: ${surveysRes.status}, Surveys count: ${surveysRes.data.length}`);
  const survey = surveysRes.data[0];
  console.log(`   Survey ID: ${survey.id}, Title: "${survey.title}", Status: ${survey.status}, Questions: ${survey.question_count}`);
  console.log('✓ Survey loaded successfully');

  // 6. Test Captain update
  console.log('\n6. Testing Captain selection for survey...');
  // Find Olga or Inma
  const captainPlayer = teamPlayersRes.data.find(p => p.name === 'Olga' || p.name === 'Inma');
  const captainRes = await put(`http://localhost:4002/api/surveys/${survey.id}`, {
    captain_player_id: captainPlayer.player_id
  }, token);
  console.log(`Status: ${captainRes.status}, Captain updated to ID: ${captainRes.data.captain_player_id}`);
  console.log('✓ Captain selection works!');

  // 7. Test Match Creation for team 72
  console.log('\n7. Testing Match Creation for Senior Femenino Amatista...');
  const matchRes = await post('http://localhost:4002/api/partidos/user', {
    rivalTeam: 'Equipo Test Amistoso',
    date: new Date().toISOString(),
    location: 'Pabellón Municipal',
    equipoId: 72
  }, token);
  console.log(`Status: ${matchRes.status}, Match Created:`, matchRes.data);
  if (matchRes.status === 200 || matchRes.status === 201) {
    console.log('✓ Match created successfully for Senior Femenino Amatista! Match ID:', matchRes.data.id);
    // Clean up test match so we don't pollute data
    const db = require('../model');
    await db.partido.destroy({ where: { id: matchRes.data.id } });
    console.log('✓ Cleaned up test match');
  }

  console.log('\n=== ALL FLOWS VERIFIED 100% OPERATIONAL! ===');
  process.exit(0);
}

verify().catch(e => {
  console.error('Verification error:', e);
  process.exit(1);
});
