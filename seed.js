// Seeds one demo user per role plus one demo bidder so the reviewer can
// log in and click through the full workflow without configuring anything.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('./config/db');

const DEMO_PASSWORD = 'ChangeMe123!';

const USERS = [
  { name: 'Amantle Officer', email: 'ao@pe.gov.bw', role: 'ACCOUNTING_OFFICER' },
  { name: 'Kagiso Oversight', email: 'oversight@pe.gov.bw', role: 'OVERSIGHT_UNIT' },
  { name: 'Boitumelo Unit', email: 'procurement@pe.gov.bw', role: 'PROCUREMENT_UNIT' },
  { name: 'Thato Department', email: 'department@pe.gov.bw', role: 'USER_DEPARTMENT' },
  { name: 'Naledi Chair', email: 'chair@pe.gov.bw', role: 'COMMITTEE_CHAIR' },
  { name: 'Lesego Member', email: 'member1@pe.gov.bw', role: 'COMMITTEE_MEMBER' },
  { name: 'Onalenna Member', email: 'member2@pe.gov.bw', role: 'COMMITTEE_MEMBER' },
  { name: 'Refilwe Secretary', email: 'secretary@pe.gov.bw', role: 'COMMITTEE_SECRETARY' },
  { name: 'Tumelo Panel', email: 'panel1@pe.gov.bw', role: 'OPENING_PANEL' },
  { name: 'Gorata Panel', email: 'panel2@pe.gov.bw', role: 'OPENING_PANEL' },
  { name: 'Mpho Auditor', email: 'auditor@pe.gov.bw', role: 'AUDITOR' },
  { name: 'System Admin', email: 'admin@pe.gov.bw', role: 'SYSTEM_ADMIN' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  const bidder = await prisma.bidder.upsert({
    where: { registrationNumber: 'BW-DEMO-0001' },
    update: {},
    create: {
      companyName: 'Kalahari Construction (Pty) Ltd',
      registrationNumber: 'BW-DEMO-0001',
      ppraCode: 'CW-01',
      contactEmail: 'bidder@kalahariconstruction.co.bw',
      verified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'bidder@kalahariconstruction.co.bw' },
    update: {},
    create: {
      name: 'Karabo Bidder',
      email: 'bidder@kalahariconstruction.co.bw',
      passwordHash,
      role: 'BIDDER',
      bidderId: bidder.id,
    },
  });

  console.log('Seed complete. All demo users share the password:', DEMO_PASSWORD);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
