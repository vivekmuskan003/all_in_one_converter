const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const fs      = require('fs');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS — allow the frontend origin (set FRONTEND_URL in .env)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173', // vite preview
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Routes
app.use('/api/audio',    require('./routes/audio'));
app.use('/api/video',    require('./routes/video'));
app.use('/api/document', require('./routes/document'));
app.use('/api/image',    require('./routes/image'));
app.use('/api/file',     require('./routes/file'));
app.use('/api/admin',    require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', env: process.env.NODE_ENV || 'development' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed frontend origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
