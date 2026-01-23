const { PrismaClient } = require('@prisma/client');
(async () => {
  const db = new PrismaClient();
  try {
    const c = await db.homeaseContent.count();
    console.log('homease_content count:', c);
  } catch (e) {
    console.error('error counting homease_content:', e);
  } finally {
    await db.$disconnect();
  }
})();
