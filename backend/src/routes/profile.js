const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/init');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './src/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.userId}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.put('/', authRequired, (req, res, next) => {
  try {
    const { name, company, bio } = req.body;
    db.prepare(
      `UPDATE users SET name = COALESCE(?, name), company = COALESCE(?, company), bio = COALESCE(?, bio), updated_at = datetime('now') WHERE id = ?`
    ).run(name, company, bio, req.userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const { password_hash, ...rest } = user;
    res.json({ user: rest });
  } catch (err) {
    next(err);
  }
});

router.post('/avatar', authRequired, upload.single('avatar'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    db.prepare(`UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`).run(
      avatarUrl,
      req.userId
    );
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
