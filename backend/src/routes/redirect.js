const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { buildEncodedString } = require('../utils/qrEncoder');

const router = express.Router();

function parseUserAgent(uaString = '') {
  const ua = uaString.toLowerCase();
  let device_type = 'desktop';
  if (/mobile|android|iphone/.test(ua)) device_type = 'mobile';
  else if (/ipad|tablet/.test(ua)) device_type = 'tablet';

  let browser = 'other';
  if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('edg')) browser = 'edge';

  let os = 'other';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('iphone') || ua.includes('ios')) os = 'ios';
  else if (ua.includes('linux')) os = 'linux';

  return { device_type, browser, os };
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
}

router.get('/:shortCode', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM qr_codes WHERE short_code = ?').get(req.params.shortCode);
    if (!row || !row.is_active) {
      return res.status(404).send('This QR code is invalid, disabled, or no longer available.');
    }

    // Log the scan (non-blocking to the redirect itself)
    const { device_type, browser, os } = parseUserAgent(req.headers['user-agent']);
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    db.prepare(`
      INSERT INTO scans (id, qr_id, ip_hash, user_agent, device_type, browser, os, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), row.id, hashIp(ip), req.headers['user-agent'] || '',
      device_type, browser, os, req.headers['referer'] || ''
    );

    const data = JSON.parse(row.target_data);

    // Multi-link QR shows a simple landing page with all links
    if (row.type === 'multilink') {
      const links = db.prepare('SELECT * FROM qr_links WHERE qr_id = ? ORDER BY order_index').all(row.id);
      return res.send(renderLandingPage(row.title, links));
    }

    const destination = buildEncodedString(row.type, data);

    // Types that aren't real HTTP URLs (tel:, mailto:, sms:, WIFI:, vcard text) should render
    // a small landing page instead of attempting an HTTP redirect.
    if (!/^https?:\/\//i.test(destination)) {
      return res.send(renderProtocolLandingPage(row.title, row.type, destination));
    }

    return res.redirect(302, destination);
  } catch (err) {
    next(err);
  }
});

function renderLandingPage(title, links) {
  const items = links.map(
    (l) => `<a class="link-btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
  ).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f7;margin:0;padding:40px 16px;display:flex;flex-direction:column;align-items:center}
h1{font-size:1.4rem;margin-bottom:24px;color:#1a1a2e}
.link-btn{display:block;width:100%;max-width:360px;padding:16px;margin-bottom:12px;background:#fff;border-radius:12px;text-align:center;text-decoration:none;color:#1a1a2e;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:transform .15s}
.link-btn:hover{transform:translateY(-2px)}
</style></head>
<body><h1>${escapeHtml(title)}</h1>${items}</body></html>`;
}

function renderProtocolLandingPage(title, type, destination) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f7;margin:0;padding:60px 16px;display:flex;flex-direction:column;align-items:center;text-align:center}
h1{font-size:1.3rem;color:#1a1a2e}
a.action{display:inline-block;margin-top:20px;padding:14px 28px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600}
pre{white-space:pre-wrap;background:#fff;padding:16px;border-radius:10px;max-width:400px;overflow:auto}
</style></head>
<body>
<h1>${escapeHtml(title)}</h1>
${type === 'wifi' ? `<pre>${escapeHtml(destination)}</pre><p>Scan directly with your camera to join the network.</p>`
  : `<a class="action" href="${escapeHtml(destination)}">Open</a>`}
</body></html>`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = router;
