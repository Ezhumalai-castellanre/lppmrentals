import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { rentalApplications, users } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the connection
const databasePath = process.env.DATABASE_URL?.startsWith('postgresql://') 
  ? './dev.db' // Use SQLite for development
  : process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
console.log('🔧 Connecting to SQLite database:', databasePath);

const sqlite = new Database(databasePath);
export const db = drizzle(sqlite);

// Export the tables for use in storage
export { rentalApplications, users }; 