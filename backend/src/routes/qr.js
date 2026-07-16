const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { nanoid } = require('nanoid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/init');
const { authRequired } = require('../middleware/auth');
const { buildEncodedString } = require('../utils/qrEncoder');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './src/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `file-${req.userId}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 15) * 1024 * 1024 } });

function serializeQr(row) {
  return {
    ...row,
    target_data: JSON.parse(row.target_data),
    is_active: !!row.is_active,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
  };
}

function getEncodedContent(row) {
  const data = JSON.parse(row.target_data);
  if (row.mode === 'dynamic') {
    return `${process.env.BASE_URL}/r/${row.short_code}`;
  }
  return buildEncodedString(row.type, data);
}

// ---- File upload for file/image/video/pdf QR types ----
router.post('/upload', authRequired, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    res.json({ fileUrl, originalName: req.file.originalname, size: req.file.size });
  } catch (err) {
    next(err);
  }
});

// ---- Create QR ----
router.post('/', authRequired, (req, res, next) => {
  try {
    const {
      title, type, mode = 'static', target_data,
      fg_color = '#000000', bg_color = '#FFFFFF', size = 300,
      folder = 'default', tags = [], links = [],
    } = req.body;

    if (!title || !type || !target_data) {
      return res.status(400).json({ error: 'title, type and target_data are required' });
    }

    // Validate the payload actually encodes correctly (throws on bad type/data)
    if (type !== 'multilink') {
      buildEncodedString(type, target_data);
    }

    const id = uuidv4();
    const short_code = mode === 'dynamic' ? nanoid(8) : null;

    db.prepare(`
      INSERT INTO qr_codes (id, user_id, title, type, mode, short_code, target_data, fg_color, bg_color, size, folder, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.userId, title, type, mode, short_code,
      JSON.stringify(target_data), fg_color, bg_color, size, folder,
      Array.isArray(tags) ? tags.join(',') : tags
    );

    if (type === 'multilink' && Array.isArray(links)) {
      const stmt = db.prepare(`INSERT INTO qr_links (id, qr_id, label, url, order_index) VALUES (?, ?, ?, ?, ?)`);
      links.forEach((l, i) => stmt.run(uuidv4(), id, l.label, l.url, i));
    }

    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(id);
    res.status(201).json({ qr: serializeQr(row) });
  } catch (err) {
    next(err);
  }
});

// ---- List / search / filter ----
router.get('/', authRequired, (req, res, next) => {
  try {
    const { search, type, mode, folder, sort = 'created_desc' } = req.query;

    let query = 'SELECT * FROM qr_codes WHERE user_id = ?';
    const params = [req.userId];

    if (search) {
      query += ' AND (title LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (mode) {
      query += ' AND mode = ?';
      params.push(mode);
    }
    if (folder) {
      query += ' AND folder = ?';
      params.push(folder);
    }

    const sortMap = {
      created_desc: 'created_at DESC',
      created_asc: 'created_at ASC',
      title_asc: 'title ASC',
      title_desc: 'title DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || sortMap.created_desc}`;

    const rows = db.prepare(query).all(...params);

    // attach scan counts
    const withCounts = rows.map((row) => {
      const { count } = db.prepare('SELECT COUNT(*) as count FROM scans WHERE qr_id = ?').get(row.id);
      return { ...serializeQr(row), scan_count: count };
    });

    res.json({ qrCodes: withCounts, total: withCounts.length });
  } catch (err) {
    next(err);
  }
});

// ---- Get single QR ----
router.get('/:id', authRequired, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!row) return res.status(404).json({ error: 'QR code not found' });

    const links = row.type === 'multilink'
      ? db.prepare('SELECT * FROM qr_links WHERE qr_id = ? ORDER BY order_index').all(row.id)
      : [];

    res.json({ qr: serializeQr(row), links });
  } catch (err) {
    next(err);
  }
});

// ---- Update QR ----
router.put('/:id', authRequired, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'QR code not found' });

    const {
      title, target_data, fg_color, bg_color, size,
      folder, tags, is_active, links,
    } = req.body;

    if (target_data) {
      buildEncodedString(existing.type, target_data);
    }

    db.prepare(`
      UPDATE qr_codes SET
        title = COALESCE(?, title),
        target_data = COALESCE(?, target_data),
        fg_color = COALESCE(?, fg_color),
        bg_color = COALESCE(?, bg_color),
        size = COALESCE(?, size),
        folder = COALESCE(?, folder),
        tags = COALESCE(?, tags),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title,
      target_data ? JSON.stringify(target_data) : null,
      fg_color, bg_color, size, folder,
      tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
      typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
      req.params.id
    );

    if (existing.type === 'multilink' && Array.isArray(links)) {
      db.prepare('DELETE FROM qr_links WHERE qr_id = ?').run(req.params.id);
      const stmt = db.prepare(`INSERT INTO qr_links (id, qr_id, label, url, order_index) VALUES (?, ?, ?, ?, ?)`);
      links.forEach((l, i) => stmt.run(uuidv4(), req.params.id, l.label, l.url, i));
    }

    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ?').get(req.params.id);
    res.json({ qr: serializeQr(row) });
  } catch (err) {
    next(err);
  }
});

// ---- Delete QR ----
router.delete('/:id', authRequired, (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM qr_codes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'QR code not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---- Generate QR image: PNG / SVG / dataURL ----
router.get('/:id/image', authRequired, async (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!row) return res.status(404).json({ error: 'QR code not found' });

    const format = (req.query.format || 'png').toLowerCase();
    const content = getEncodedContent(row);

    const options = {
      width: row.size || 300,
      margin: 2,
      color: { dark: row.fg_color || '#000000', light: row.bg_color || '#FFFFFF' },
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(content, { ...options, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${row.title}.svg"`);
      return res.send(svg);
    }

    if (format === 'dataurl') {
      const dataUrl = await QRCode.toDataURL(content, options);
      return res.json({ dataUrl });
    }

    // default PNG
    const buffer = await QRCode.toBuffer(content, options);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${row.title}.png"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// ---- Analytics ----
router.get('/:id/analytics', authRequired, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM qr_codes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!row) return res.status(404).json({ error: 'QR code not found' });

    const totalScans = db.prepare('SELECT COUNT(*) as count FROM scans WHERE qr_id = ?').get(row.id).count;

    const scansByDay = db.prepare(`
      SELECT date(scanned_at) as day, COUNT(*) as count
      FROM scans WHERE qr_id = ?
      GROUP BY day ORDER BY day ASC LIMIT 30
    `).all(row.id);

    const scansByDevice = db.prepare(`
      SELECT device_type, COUNT(*) as count FROM scans
      WHERE qr_id = ? GROUP BY device_type
    `).all(row.id);

    const scansByBrowser = db.prepare(`
      SELECT browser, COUNT(*) as count FROM scans
      WHERE qr_id = ? GROUP BY browser
    `).all(row.id);

    const recentScans = db.prepare(`
      SELECT scanned_at, device_type, browser, os, referrer
      FROM scans WHERE qr_id = ? ORDER BY scanned_at DESC LIMIT 20
    `).all(row.id);

    res.json({ totalScans, scansByDay, scansByDevice, scansByBrowser, recentScans });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
