const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== Database Cleanup ===\n');
    let total = 0;

    // 1. Find and merge duplicate users by name
    const dupes = await prisma.$queryRaw`
        SELECT u1.id as id1, u2.id as id2, u1.name, u1.customId as c1, u2.customId as c2
        FROM User u1
        JOIN User u2 ON LOWER(u1.name) = LOWER(u2.name) AND u1.id != u2.id
        WHERE u1.name IS NOT NULL AND u1.name != ''
        GROUP BY u1.id, u2.id
    `;
    
    const processed = new Set();
    for (const d of dupes) {
        if (processed.has(d.id1) || processed.has(d.id2)) continue;
        processed.add(d.id1);
        processed.add(d.id2);
        
        // Keep the one with more history or higher customId
        const h1 = await prisma.history.count({ where: { userId: d.id1 } });
        const h2 = await prisma.history.count({ where: { userId: d.id2 } });
        const keep = h1 >= h2 ? d.id1 : d.id2;
        const remove = keep === d.id1 ? d.id2 : d.id1;
        
        console.log(`Merge duplicate: ${d.name} — keep ${keep} (${h1 === h2 ? 'same history' : h1 > h1 ? 'more history' : 'higher ID'}), delete ${remove}`);
        
        // Migrate data
        await prisma.history.updateMany({ where: { userId: remove }, data: { userId: keep } });
        const removeProg = await prisma.userProgress.findUnique({ where: { userId: remove } });
        if (removeProg) {
            const keepProg = await prisma.userProgress.findUnique({ where: { userId: keep } });
            if (keepProg) {
                await prisma.userProgress.update({
                    where: { userId: keep },
                    data: { xp: keepProg.xp + removeProg.xp, level: Math.max(keepProg.level, removeProg.level) }
                });
                await prisma.userProgress.delete({ where: { userId: remove } });
            } else {
                await prisma.userProgress.update({ where: { userId: remove }, data: { userId: keep } });
            }
        }
        // Copy packname if missing
        const removeUser = await prisma.user.findUnique({ where: { id: remove }, select: { packname: true } });
        const keepUser = await prisma.user.findUnique({ where: { id: keep }, select: { packname: true } });
        if (removeUser?.packname && !keepUser?.packname) {
            await prisma.user.update({ where: { id: keep }, data: { packname: removeUser.packname } });
        }
        await prisma.history.deleteMany({ where: { userId: remove } });
        await prisma.user.delete({ where: { id: remove } });
        total++;
    }

    // 2. Delete bot device suffix entries (bot number :device)
    const botNumber = '6288994338064';
    const botDevices = await prisma.user.findMany({
        where: { id: { startsWith: `${botNumber}:` } },
        select: { id: true }
    });
    for (const u of botDevices) {
        await prisma.history.deleteMany({ where: { userId: u.id } });
        await prisma.userProgress.deleteMany({ where: { userId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
        console.log('Deleted bot device:', u.id);
        total++;
    }

    // 3. Fix all other device suffix entries (xxx:device@s.whatsapp.net → xxx@s.whatsapp.net)
    const deviceSuffixUsers = await prisma.user.findMany({
        where: { id: { contains: ':', endsWith: '@s.whatsapp.net' } },
        select: { id: true }
    });
    for (const u of deviceSuffixUsers) {
        const cleanId = u.id.split(':')[0] + '@s.whatsapp.net';
        const existing = await prisma.user.findUnique({ where: { id: cleanId } });
        
        if (existing) {
            await prisma.history.updateMany({ where: { userId: u.id }, data: { userId: cleanId } });
            const prog = await prisma.userProgress.findUnique({ where: { userId: u.id } });
            if (prog) {
                const existingProg = await prisma.userProgress.findUnique({ where: { userId: cleanId } });
                if (existingProg) {
                    await prisma.userProgress.update({ where: { userId: cleanId }, data: { xp: existingProg.xp + prog.xp, level: Math.max(existingProg.level, prog.level) } });
                } else {
                    await prisma.userProgress.update({ where: { userId: u.id }, data: { userId: cleanId } });
                }
                await prisma.userProgress.deleteMany({ where: { userId: u.id } });
            }
            await prisma.history.deleteMany({ where: { userId: u.id } });
            await prisma.user.delete({ where: { id: u.id } });
            console.log('Merged device entry:', u.id, '→', cleanId);
        } else {
            await prisma.history.updateMany({ where: { userId: u.id }, data: { userId: cleanId } });
            const prog = await prisma.userProgress.findUnique({ where: { userId: u.id } });
            if (prog) await prisma.userProgress.update({ where: { userId: u.id }, data: { userId: cleanId } });
            await prisma.user.update({ where: { id: u.id }, data: { id: cleanId } });
            console.log('Renamed device entry:', u.id, '→', cleanId);
        }
        total++;
    }

    const finalCount = await prisma.user.count();
    const lidCount = await prisma.user.count({ where: { id: { endsWith: '@lid' } } });
    const deviceCount = await prisma.user.findMany({ where: { id: { contains: ':' } }, select: { id: true } });

    console.log(`\n=== DONE ===`);
    console.log(`Cleaned: ${total} entries`);
    console.log(`Total users: ${finalCount}`);
    console.log(`LID users: ${lidCount}`);
    console.log(`Device suffix remaining: ${deviceCount.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
