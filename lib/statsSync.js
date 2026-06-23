const axios = require('axios');
const prisma = require('./db');
const chalk = require('chalk');
const moment = require('moment-timezone');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 menit

let intervalId = null;

const log = {
  ok: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' STATS ')} ${msg}`),
  info: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgBlue(' STATS ')} ${msg}`),
  err: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgRed(' STATS ')} ${msg}`),
};

async function getStats() {
  const [totalUsers, totalGroups, totalCommands, totalBanned] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.history.aggregate({ _max: { id: true } }),
    prisma.user.count({ where: { isBanned: true } }),
  ]);
  return { total_users: totalUsers, total_groups: totalGroups, total_commands: totalCommands._max.id || 0, total_banned: totalBanned };
}

async function pushStats() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const stats = await getStats();
    await axios.post(`${SUPABASE_URL}/rest/v1/stats`, { ...stats, is_online: true, updated_at: new Date().toISOString() }, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
    });
    log.ok(`Pushed — ${stats.total_users} users, ${stats.total_groups} groups, ${stats.total_commands} commands`);
  } catch (err) {
    log.err(`Push failed: ${err.message}`);
  }
}



function start() {
  if (intervalId) return;
  pushStats();
  intervalId = setInterval(pushStats, SYNC_INTERVAL);
  log.info('Sync every 30 menit');
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  log.info('Stopped');
}

module.exports = { start, stop, pushStats, getStats };
