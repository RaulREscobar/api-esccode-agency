import { PrismaClient, UserRole, QuoteStatus, ProjectStatus, PriorityLevel } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@esccode.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'EscCode123!';

  const passwordHash = await argon2.hash(ownerPassword);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
    create: {
      email: ownerEmail,
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  const workTypes = [
    { name: 'Landing', category: 'Web', basePrice: 950, allowsExtras: false },
    { name: 'Página institucional', category: 'Web', basePrice: 1200, allowsExtras: true },
    { name: 'Ecommerce', category: 'Web', basePrice: 2800, allowsExtras: true },
    { name: 'Arreglos en WordPress', category: 'WordPress', basePrice: 550, allowsExtras: false },
    { name: 'Modificaciones en WordPress - Leve', category: 'WordPress', basePrice: 350, allowsExtras: false },
    { name: 'Modificaciones en WordPress - Media', category: 'WordPress', basePrice: 650, allowsExtras: false },
    { name: 'Modificaciones en WordPress - Avanzada', category: 'WordPress', basePrice: 1100, allowsExtras: false },
    { name: 'Mantenimiento', category: 'Web', basePrice: 450, allowsExtras: true },
  ];

  for (const workType of workTypes) {
    await prisma.workType.upsert({
      where: { name: workType.name },
      update: workType,
      create: workType,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
