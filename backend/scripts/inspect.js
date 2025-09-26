const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    console.log('user.count', count);
    const user = await prisma.user.findFirst();
    console.log('first user', user);
    if (user) {
      const ok = await bcrypt.compare('password123', user.password);
      console.log('bcrypt.compare(password123) =>', ok);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


