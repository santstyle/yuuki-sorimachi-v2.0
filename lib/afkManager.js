const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/userGroupData.json');

function load() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[AFK] Error loading data:', e);
    }
    return {};
}

function save(data) {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[AFK] Error saving data:', e);
    }
}

async function setAfk(userId, reason = '') {
    const data = load();
    if (!data.afk) data.afk = {};
    data.afk[userId] = {
        reason,
        since: new Date().toISOString()
    };
    save(data);
}

async function clearAfk(userId) {
    const data = load();
    if (!data.afk || !data.afk[userId]) return null;
    const afkData = data.afk[userId];
    delete data.afk[userId];
    save(data);
    return afkData;
}

async function getAfk(userId) {
    const data = load();
    if (!data.afk) return null;
    return data.afk[userId] || null;
}

module.exports = { setAfk, clearAfk, getAfk };
