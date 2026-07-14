require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertUser({ username, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword, role, active: true },
    create: { username, email, password: hashedPassword, role, active: true },
  });
}

async function loginUser(username, password) {
  const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.text();
  const cookie = response.headers.get('set-cookie');
  return { response, body, cookie };
}

async function test() {
  try {
    await upsertUser({ username: 'tanzeel', email: 'tanzeel@example.com', password: 'Exec@123', role: 'EXECUTIVE' });
    await upsertUser({ username: 'teamlead', email: 'teamlead@example.com', password: 'TeamLead@123', role: 'TEAM_LEADER' });

    const teamLeaders = await prisma.user.findMany({ where: { role: 'TEAM_LEADER' }, select: { id: true, username: true, active: true } });
    const executives = await prisma.user.findMany({ where: { role: 'EXECUTIVE' }, select: { id: true, username: true, active: true } });

    console.log('TEAM_LEADER accounts:', teamLeaders.length);
    teamLeaders.forEach((u) => console.log(`- ${u.username} (${u.id}) active=${u.active}`));
    console.log('EXECUTIVE accounts:', executives.length);
    executives.forEach((u) => console.log(`- ${u.username} (${u.id}) active=${u.active}`));

    console.log('\n--- Executive login test ---');
    const execLogin = await loginUser('tanzeel', 'Exec@123');
    console.log('status:', execLogin.response.status);
    console.log('body:', execLogin.body);
    const execCookie = execLogin.cookie;
    console.log('cookie:', execCookie ? execCookie.split(';')[0] : 'none');

    if (execLogin.response.ok && execCookie) {
      const execLeads = await fetch('http://127.0.0.1:3000/api/leads', { headers: { Cookie: execCookie } });
      console.log('/api/leads status:', execLeads.status);
      console.log('/api/leads body len:', (await execLeads.text()).length);
      const execDash = await fetch('http://127.0.0.1:3000/executive/dashboard', { headers: { Cookie: execCookie } });
      console.log('/executive/dashboard status:', execDash.status);
      console.log('/executive/dashboard body len:', (await execDash.text()).length);
    }

    console.log('\n--- Team leader login test ---');
    const teamLeadLogin = await loginUser('teamlead', 'TeamLead@123');
    console.log('status:', teamLeadLogin.response.status);
    console.log('body:', teamLeadLogin.body);
    const teamLeadCookie = teamLeadLogin.cookie;
    console.log('cookie:', teamLeadCookie ? teamLeadCookie.split(';')[0] : 'none');

    if (teamLeadLogin.response.ok && teamLeadCookie) {
      const teamLeads = await fetch('http://127.0.0.1:3000/api/leads', { headers: { Cookie: teamLeadCookie } });
      console.log('/api/leads status:', teamLeads.status);
      console.log('/api/leads body len:', (await teamLeads.text()).length);
      const execLeads = await fetch('http://127.0.0.1:3000/api/executive/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: teamLeadCookie }, body: JSON.stringify({ leadId: null, remark: 'BUSY' }) });
      console.log('/api/executive/leads POST status:', execLeads.status);
      console.log('/api/executive/leads POST body len:', (await execLeads.text()).length);
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
