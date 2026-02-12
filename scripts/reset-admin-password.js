/**
 * One-time script: reset admin user password to admin123
 * Run: node scripts/reset-admin-password.js (from project root, with .env loaded)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('No admin user found. Run: npx prisma db seed');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash },
  });
  console.log('Done. Admin password set to: admin123');
  console.log('Login with staffId:', admin.staffId, 'and password: admin123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
