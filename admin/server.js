const express = require('express');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = require('../lib/db');

const app = express();
const PORT = process.env.ADMIN_PORT || 3000;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'yuuki-admin-secret-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

app.use(express.json());
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets'), { etag: false, maxAge: 0 }));

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
    return res.redirect('/');
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('token');
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
    return res.redirect('/');
  }
}

app.get('/api/check', authenticate, (req, res) => {
  res.json({ ok: true, user: req.user.username });
});

app.get('/api/bot-status', async (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'botStatus.json'), 'utf8'));
    res.json(data);
  } catch {
    res.json({ online: false, updatedAt: null });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const SORTABLE = {
  User: ['createdAt', 'updatedAt', 'name'],
  UserProgress: ['level', 'xp', 'streak', 'lastActive'],
  UserStyle: ['totalMessages', 'formalityScore', 'relationshipLevel', 'lastInteraction', 'createdAt'],
  Group: ['createdAt', 'updatedAt', 'name'],
  GroupSettings: ['id'],
  WarningRecord: ['createdAt'],
  History: ['createdAt'],
};

const SEARCHABLE = {
  User: ['id', 'name'],
  UserProgress: ['userId', 'userName'],
  UserStyle: ['userId'],
  Group: ['id', 'name'],
  GroupSettings: ['groupId', 'groupName'],
  WarningRecord: ['userId', 'userName', 'reason', 'moderatorName'],
  History: ['userId', 'userName', 'command', 'chatId'],
};

const EXCLUDE_CREATE = {
  User: ['customId', 'createdAt', 'updatedAt'],
  UserProgress: ['id'],
  UserStyle: ['id', 'createdAt', 'updatedAt'],
  Group: ['createdAt', 'updatedAt'],
  GroupSettings: ['id'],
  WarningRecord: ['id', 'createdAt'],
  History: ['id', 'createdAt'],
};

app.get('/api/models', authenticate, async (req, res) => {
  const names = Object.keys(prisma).filter(k => !k.startsWith('_') && typeof prisma[k] === 'object' && prisma[k]?.findMany);
  res.json(names);
});

app.get('/api/model/:name', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const delegate = prisma[modelName];
  if (!delegate?.findMany) return res.status(404).json({ error: 'Model not found' });

  try {
    const { page = 1, limit = 50, sort, order = 'desc', search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));

    const allowedSort = SORTABLE[modelName] || [];
    let orderBy;
    if (sort && allowedSort.includes(sort)) {
      const dir = order === 'asc' ? 'asc' : 'desc';
      orderBy = [{ [sort]: dir }];
      if (sort === 'level' && modelName === 'UserProgress') orderBy.push({ xp: dir });
    } else {
      const defaultSort = allowedSort.includes('createdAt') ? 'createdAt' : (allowedSort[0] || 'id');
      orderBy = [{ [defaultSort]: 'desc' }];
    }

    const where = {};
    if (search && SEARCHABLE[modelName]) {
      where.OR = SEARCHABLE[modelName].map(f => ({ [f]: { contains: search } }));
    }

    const [total, data] = await Promise.all([
      delegate.count({ where }),
      delegate.findMany({ where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum }),
    ]);

    // Tambahan JS sort buat jaga-jaga kalo Prisma orderBy array ga respected
    if (modelName === 'UserProgress') {
      data.sort((a, b) => {
        const primary = sort === 'level' || !sort ? b.level - a.level : (sort === 'xp' || !sort ? b.xp - a.xp : 0);
        if (primary !== 0) return primary;
        return b.xp - a.xp;
      });
    }

    const modelFields = Object.keys(prisma[modelName].fields || prisma._dmmf?.datamodel?.models?.find(m => m.name === modelName)?.fields || (data.length ? Object.keys(data[0]) : []));

    let fields;
    try {
      const dmmf = prisma._dmmf?.datamodel?.models;
      const schema = dmmf?.find(m => m.name === modelName);
      fields = schema?.fields?.map(f => ({
        name: f.name,
        type: f.type,
        isId: f.isId,
        isRequired: f.isRequired,
        kind: f.kind,
        relationName: f.relationName || null,
        isList: f.isList,
      })) || (data.length ? Object.keys(data[0]).map(n => ({ name: n, type: 'String', isId: n === 'id', isRequired: false, kind: 'scalar' })) : []);
    } catch {
      fields = data.length ? Object.keys(data[0]).map(n => ({ name: n, type: 'String', isId: n === 'id', isRequired: false, kind: 'scalar' })) : [];
    }

    const related = fields.filter(f => f.kind === 'object' && !f.isList).map(f => f.name);

    res.json({ data, total, page: pageNum, limit: limitNum, fields, related, sortable: allowedSort, searchable: SEARCHABLE[modelName] || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/model/:name/:id', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const delegate = prisma[modelName];
  if (!delegate?.findUnique) return res.status(404).json({ error: 'Model not found' });

  try {
    const dmmf = prisma._dmmf?.datamodel?.models;
    const schema = dmmf?.find(m => m.name === modelName);
    const idField = schema?.fields?.find(f => f.isId)?.name || 'id';
    const record = await delegate.findUnique({ where: { [idField]: isNaN(req.params.id) ? req.params.id : parseInt(req.params.id) } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/model/:name/:id', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const delegate = prisma[modelName];
  if (!delegate?.update) return res.status(404).json({ error: 'Model not found' });

  try {
    const dmmf = prisma._dmmf?.datamodel?.models;
    const schema = dmmf?.find(m => m.name === modelName);
    const idField = schema?.fields?.find(f => f.isId)?.name || 'id';
    const record = await delegate.update({
      where: { [idField]: isNaN(req.params.id) ? req.params.id : parseInt(req.params.id) },
      data: req.body,
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/model/:name/bulk-delete', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const delegate = prisma[modelName];
  if (!delegate?.deleteMany) return res.status(404).json({ error: 'Model not found' });
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });
    const dmmf = prisma._dmmf?.datamodel?.models;
    const schema = dmmf?.find(m => m.name === modelName);
    const idField = schema?.fields?.find(f => f.isId)?.name || 'id';
    const parsedIds = ids.map(id => isNaN(id) ? id : parseInt(id));
    await delegate.deleteMany({ where: { [idField]: { in: parsedIds } } });
    res.json({ ok: true, deleted: ids.length });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete: record has related data (foreign key constraint). Delete the related records first.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/model/:name/:id', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const delegate = prisma[modelName];
  if (!delegate?.delete) return res.status(404).json({ error: 'Model not found' });

  try {
    const dmmf = prisma._dmmf?.datamodel?.models;
    const schema = dmmf?.find(m => m.name === modelName);
    const idField = schema?.fields?.find(f => f.isId)?.name || 'id';
    await delegate.delete({ where: { [idField]: isNaN(req.params.id) ? req.params.id : parseInt(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete: record has related data. Delete related records first.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-names', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { name: { not: null } } });
    let synced = 0;
    for (const u of users) {
      const [p, h, w] = await Promise.all([
        prisma.userProgress.updateMany({ where: { userId: u.id, userName: { not: u.name } }, data: { userName: u.name } }),
        prisma.history.updateMany({ where: { userId: u.id, userName: { not: u.name } }, data: { userName: u.name } }),
        prisma.warningRecord.updateMany({ where: { userId: u.id, userName: { not: u.name } }, data: { userName: u.name } }),
      ]);
      if (p.count > 0 || h.count > 0 || w.count > 0) synced++;
    }
    res.json({ ok: true, synced, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/model/:name/related/:field', authenticate, async (req, res) => {
  const modelName = toPascalCase(req.params.name);
  const field = req.params.field;
  const delegate = prisma[modelName];
  if (!delegate?.findMany) return res.status(404).json({ error: 'Model not found' });

  try {
    const data = await delegate.findMany({ take: 100 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/*', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/admin');
    } catch {}
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Admin Panel] Running on http://0.0.0.0:${PORT}`);
  console.log(`[Admin Panel] Access via Tailscale: http://<tailscale-ip>:${PORT}/admin`);
});
