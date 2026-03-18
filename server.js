const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

/* ✅ CORS — supports local + deployed frontend */
const allowedOrigins = [
  'http://localhost:5173', // local frontend
  process.env.CORS_ORIGIN, // deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

/* security & parsers */
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* rate limiting */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  })
);

/* ✅ Root route (prevents 404 confusion) */
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

/* health check */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* routes */
app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donors', require('./routes/donorRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));

/* error handler */
app.use(errorHandler);

/* ✅ PORT fix for Render */
const PORT = process.env.PORT || 5000;

/* connect DB and start server */
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('DB connection failed', err);
    process.exit(1);
  });
