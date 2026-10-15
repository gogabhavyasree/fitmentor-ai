const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { randomBytes } = require('crypto');

const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const foodRoutes = require('./routes/foodRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const dailyCoachRoutes = require('./routes/dailyCoachRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitmentor-ai';
const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (isProduction) {
    console.warn('SESSION_SECRET is missing or short (<32 chars); generating a secure random session secret.');
  }
  sessionSecret = sessionSecret && sessionSecret.length >= 32 ? sessionSecret : randomBytes(32).toString('hex');
}

let mongoConnected = false;

if (isProduction) {
  if (!process.env.MONGODB_URI) {
    console.warn('CRITICAL: MONGODB_URI is not set in environment variables. Database operations will return 503 until configured.');
  }
  app.set('trust proxy', 1);
} else {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI && isProduction) {
    console.error('Cannot connect to MongoDB: MONGODB_URI is empty. Please set MONGODB_URI in Render environment variables.');
    return;
  }
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    mongoConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    mongoConnected = false;
    console.error('MongoDB connection failed. Database-dependent APIs will return 503 until MongoDB is available.');
    console.error(error.message);
  }
};

const startServer = async () => {
  await connectDatabase();

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    ...(mongoConnected && mongoose.connection.readyState === 1 ? {
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName: mongoose.connection.name,
        collectionName: 'sessions',
      }),
    } : {}),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  }));

  // Healthcheck endpoint (Always available for Render liveness probes)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'FitMentor AI backend is running',
      connectedToMongo: mongoConnected && mongoose.connection.readyState === 1,
    });
  });

  // Guard for database-dependent API endpoints
  app.use('/api', (req, res, next) => {
    if (!mongoConnected || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'MongoDB is not connected. Start MongoDB to save or load account data.' });
    }
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/food', foodRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/coach', dailyCoachRoutes);

  if (process.env.NODE_ENV === 'production') {
    const clientBuild = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuild));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.render('home', { title: 'FitMentor AI', user: req.session.user || null });
    });
    app.get('/login', (req, res) => {
      res.render('login', { title: 'Login', user: req.session.user || null });
    });
    app.get('/register', (req, res) => {
      res.render('register', { title: 'Register', user: req.session.user || null });
    });
    app.get('/dashboard', (req, res) => {
      res.render('dashboard', { title: 'Dashboard', user: req.session.user || null });
    });
  }
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  });

  app.listen(port, () => {
    console.log(`FitMentor AI server running on http://localhost:${port}`);
  });
};

startServer();
