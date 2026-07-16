require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('./db/init'); // ensures tables exist on boot

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const qrRoutes = require('./routes/qr');
const redirectRoutes = require('./routes/redirect');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', apiLimiter);

app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './src/uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/qr', qrRoutes);

// Short, public redirect route for dynamic QR codes: e.g. BASE_URL/r/abc123
app.use('/r', redirectRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Unified QR Platform API running on port ${PORT}`);
});
