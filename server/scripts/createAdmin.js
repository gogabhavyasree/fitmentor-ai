const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ask = (prompt) => new Promise((resolve) => {
  const interface_ = readline.createInterface({ input: process.stdin, output: process.stdout });
  interface_.question(prompt, (answer) => {
    interface_.close();
    resolve(answer.trim());
  });
});

const askHidden = (prompt) => new Promise((resolve, reject) => {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    reject(new Error('Run this command in an interactive terminal so the password can be entered securely.'));
    return;
  }

  readline.emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  process.stdout.write(prompt);
  let value = '';

  const finish = (error) => {
    input.removeListener('keypress', onKeypress);
    input.setRawMode(false);
    process.stdout.write('\n');
    if (error) reject(error);
    else resolve(value);
  };

  const onKeypress = (character, key) => {
    if (key.ctrl && key.name === 'c') {
      finish(new Error('Admin creation cancelled.'));
    } else if (key.name === 'return') {
      finish();
    } else if (key.name === 'backspace') {
      value = value.slice(0, -1);
      process.stdout.write('\b \b');
    } else if (character && !key.ctrl && !key.meta) {
      value += character;
      process.stdout.write('*');
    }
  };

  input.on('keypress', onKeypress);
});

const createInitialAdmin = async ({ name, email, password }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (typeof name !== 'string' || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a name and a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Admin passwords must contain at least 12 characters.');
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitmentor-ai';
  await mongoose.connect(mongoUri);

  const existingAdmin = await User.exists({ role: 'admin' });
  if (existingAdmin) {
    throw new Error('This database already has an administrator. Use Admin → Users to manage additional admins.');
  }
  if (await User.exists({ email: normalizedEmail })) {
    throw new Error('An account already exists for that email. Choose a new email for the initial admin.');
  }

  const bootstrap = mongoose.connection.collection('admin_bootstrap');
  try {
    await bootstrap.insertOne({ _id: 'initial-admin', createdAt: new Date() });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Initial admin setup has already completed or is currently in progress.');
    }
    throw error;
  }

  try {
    if (await User.exists({ role: 'admin' })) {
      throw new Error('An administrator was created concurrently. No account was added.');
    }

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      age: 18,
      goal: 'General Fitness',
      role: 'admin',
    });
    console.log(`Initial admin account created for ${normalizedEmail}.`);
    return admin;
  } catch (error) {
    await bootstrap.deleteOne({ _id: 'initial-admin' });
    throw error;
  }
};

const main = async () => {
  const name = await ask('Admin name: ');
  const email = await ask('Admin email: ');
  const password = await askHidden('Admin password (12+ characters): ');
  const confirmation = await askHidden('Confirm admin password: ');
  if (password !== confirmation) throw new Error('Passwords must match and contain at least 12 characters.');
  await createInitialAdmin({ name, email, password });
};

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = createInitialAdmin;
