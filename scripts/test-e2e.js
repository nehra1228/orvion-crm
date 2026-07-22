require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = globalThis.fetch || require('node-fetch');

const BASE = process.env.TEST_BASE || 'http://127.0.0.1:3001';

async function upsertUser({ username, email, password, role }) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword, role, active: true },
    create: { username, email, password: hashedPassword, role, active: true },
  });
}

async function loginUser(username, password) {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.text();
  const setCookie = response.headers.get('set-cookie');
  return { response, body, cookie: setCookie };
}

async function run() {
  try {
    console.log('Upserting test users...');
    await upsertUser({ username: 'tanzeel', email: 'tanzeel@example.com', password: 'Exec@123', role: 'EXECUTIVE' });

    console.log('Logging in as executive...');
    const login = await loginUser('tanzeel', 'Exec@123');
    console.log('Login status:', login.response.status);
    let loginJson = {};
    try { loginJson = JSON.parse(login.body); } catch (e) { /* ignore */ }
    console.log('Login body (trimmed):', JSON.stringify(loginJson).slice(0, 300));
    const cookie = login.cookie;
    const execId = loginJson?.user?.id;
    console.log('Cookie present:', !!cookie, 'execId:', execId);

    if (!login.response.ok || !cookie || !execId) {
      console.error('Login failed or missing exec ID, aborting tests.');
      return;
    }

    // Create a lead to use for manual call
    console.log('Creating a test lead...');
    const leadRes = await fetch(`${BASE}/api/leads`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'E2E Lead', mobile: '9999999999' })
    });
    const lead = await leadRes.json();
    console.log('Lead created id:', lead.id ?? JSON.stringify(lead).slice(0,120));

    // Assign the lead to the executive so the manual-call endpoint authorizes
    console.log('Assigning lead to executive...');
    const assignRes = await fetch(`${BASE}/api/leads/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedToId: execId }) });
    console.log('/api/leads/:id assign status:', assignRes.status, 'body:', await assignRes.text());

    // Mark presence
    console.log('Posting presence (mark-in)...');
    const pres = await fetch(`${BASE}/api/executive/presence`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ status: 'PRESENT' }) });
    console.log('/api/executive/presence status:', pres.status, 'body:', await pres.text());

    // Manual call
    console.log('Creating manual call...');
    const callRes = await fetch(`${BASE}/api/executive/calls`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ leadId: lead.id }) });
    console.log('/api/executive/calls status:', callRes.status, 'body:', await callRes.text());

    // Admin reports access check
    console.log('\n--- Admin reports access check ---');
    await upsertUser({ username: 'admin', email: 'admin@example.com', password: 'Admin@123', role: 'ADMIN' });
    const adminLogin = await loginUser('admin', 'Admin@123');
    const adminCookie = adminLogin.cookie;
    console.log('Admin login status:', adminLogin.response.status, 'cookie present:', !!adminCookie);
    if (adminLogin.response.ok && adminCookie) {
      const reports = await fetch(`${BASE}/admin/reports`, { headers: { Cookie: adminCookie } });
      console.log('/admin/reports status:', reports.status, 'len:', (await reports.text()).length);
    }

  } catch (err) {
    console.error('E2E ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
