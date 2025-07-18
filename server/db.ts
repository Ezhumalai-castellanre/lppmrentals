import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { rentalApplications } from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
export const db = drizzle(client);

// Export the table for use in storage
export { rentalApplications }; 