
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Fetching instance 1...');
    const result = await prisma.instance.findUnique({
      where: { id: 1 },
      include: {
        admin: true,
        teams: {
          include: {
            groups: {
              include: {
                _count: {
                  select: { children: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            teams: true,
            localActions: true
          }
        }
      },
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
