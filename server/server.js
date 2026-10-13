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
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? '' : randomBytes(32).toString('hex'));
let mongoConnected = false;

if (isProduction) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production.');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
  }
  app.set('trust proxy', 1);
} else {
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET is not set; using a temporary random secret for this server process.');
  }
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
  try {
    await mongoose.connect(mongoUri);
    mongoConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed. Persistent app APIs are unavailable until MongoDB is running.');
    console.error(error.message);
    if (process.env.NODE_ENV === 'production') throw error;
  }
};

const startServer = async () => {
  await connectDatabase();

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    ...(mongoConnected ? {
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        dbName: mongoose.connection.name,
        collectionName: 'sessions',
      }),
    } : {}),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  }));

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

  app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    }
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
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'FitMentor AI backend is running',
      connectedToMongo: mongoConnected && mongoose.connection.readyState === 1,
    });
  });
  if (process.env.NODE_ENV === 'production') {
    const clientBuild = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuild));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientBuild, 'index.html'));
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
