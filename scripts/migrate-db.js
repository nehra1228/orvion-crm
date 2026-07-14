require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const expectedUserColumns = ['id', 'username', 'email', 'password', 'role', 'active', 'fullName', 'companyId', 'departmentId', 'teamId', 'createdAt', 'updatedAt'];
const expectedRoleValues = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'BRANCH_MANAGER',
  'DEPARTMENT_MANAGER',
  'TEAM_LEADER',
  'EXECUTIVE',
  'TELECALLER',
  'HR',
  'MARKETING',
  'ACCOUNTS',
  'QA',
  'SUPPORT',
];

async function main() {
  await client.connect();

  const userColumns = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='User' ORDER BY ordinal_position"
  );
  const currentColumns = userColumns.rows.map((row) => row.column_name);
  console.log('Current User columns:', currentColumns);

  const missingCols = expectedUserColumns.filter((col) => !currentColumns.includes(col));
  for (const col of missingCols) {
    const type = ['id', 'username', 'email', 'password', 'role', 'active', 'createdAt', 'updatedAt'].includes(col)
      ? null
      : 'TEXT';
    const sql = type
      ? `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${col}" ${type}`
      : null;

    if (sql) {
      console.log('Adding column', col);
      await client.query(sql);
    }
  }

  const enumData = await client.query(
    `SELECT e.enumlabel AS value
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typname = 'Role'
     ORDER BY e.enumsortorder`
  );
  const currentRoleValues = enumData.rows.map((row) => row.value);
  console.log('Current Role enum values:', currentRoleValues);

  const missingRoleValues = expectedRoleValues.filter((value) => !currentRoleValues.includes(value));
  for (const value of missingRoleValues) {
    console.log('Adding enum value', value);
    await client.query(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS '${value}'`);
  }

  const updatedColumns = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='User' ORDER BY ordinal_position"
  );
  console.log('Updated User columns:', updatedColumns.rows.map((row) => row.column_name));

  const updatedEnum = await client.query(
    `SELECT e.enumlabel AS value
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typname = 'Role'
     ORDER BY e.enumsortorder`
  );
  console.log('Updated Role enum values:', updatedEnum.rows.map((row) => row.value));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await client.end();
});
