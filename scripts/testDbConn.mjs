import dotenv from 'dotenv';
dotenv.config();

import { poolPromise } from '../src/config/db.js';

const run = async () => {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '[SET]' : '[NOT SET]');
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as is_alive');
    console.log('DB connected (test) ✅', result.recordset[0]);
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('DB connection error (test):');
    console.error(err);
    process.exit(1);
  }
};

run();
