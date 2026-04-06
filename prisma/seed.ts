import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminExists) {
    console.log('Admin user already exists. Skip seed.');
    return;
  }
  const hash = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      staffId: 'admin',
      passwordHash: hash,
      role: 'ADMIN',
      name: 'مدير النظام',
    },
  });
  console.log('Admin user created: staffId=admin, password=admin123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
