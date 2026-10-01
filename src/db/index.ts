import 'dotenv/config'
import {drizzle} from 'drizzle-orm/neon-http';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

export const db = drizzle(url);