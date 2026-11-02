import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'Error: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables are required.',
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { isSuperAdmin: true },
    create: {
      name: 'Super Admin',
      email,
      password: hashedPassword,
      isSuperAdmin: true,
      role: 'ADMIN',
    },
  });

  const maskedEmail = `${email.substring(0, 2)}***@${email.split('@')[1]}`;
  console.log(`Superadmin upserted: ${maskedEmail}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
