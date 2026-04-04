import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('mudar123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'contato.twebdesigner@gmail.com' },
    update: {},
    create: {
      name: 'Thiago Corbalan',
      email: 'contato.twebdesigner@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin criado: ${admin.name} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
