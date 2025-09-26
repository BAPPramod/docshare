/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Alice Johnson'
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Bob Smith'
      }
    }),
    prisma.user.create({
      data: {
        email: 'carol@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Carol Davis'
      }
    })
  ]);

  console.log(`Created ${users.length} users`);
  console.log('Seed data created successfully!');
  console.log('\nTest accounts:');
  console.log('- alice@example.com / password123');
  console.log('- bob@example.com / password123');
  console.log('- carol@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });