const prisma = require('./db');

async function getNextCustomId() {
  const max = await prisma.user.findFirst({
    orderBy: { customId: 'desc' },
    select: { customId: true }
  });
  return max ? max.customId + 1 : 10000000;
}

module.exports = { getNextCustomId };
