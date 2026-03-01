import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../src/config/db.js';

const run = async () => {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '[SET]' : '[NOT SET]');
    const client = await pool.connect();
    console.log('DB connected (test) ✅');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection error (test):');
    console.error(err);
    process.exit(1);
  }
};

run();
