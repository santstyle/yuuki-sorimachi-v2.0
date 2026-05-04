const prisma = require('./db');

async function isBanned(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        return user?.isBanned || false;
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned }; 