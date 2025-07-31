import { db, rentalApplications, users } from './db';
import { eq } from 'drizzle-orm';
import type { RentalApplication, InsertRentalApplication, User, InsertUser } from '@shared/schema';
import { randomUUID } from 'crypto';

/**
 * Generate a timezone-based UUID for ApplicantId
 * Uses timezone information to create a unique identifier
 */
function generateTimezoneBasedUUID(): string {
  try {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const timezoneOffset = now.getTimezoneOffset();
    
    // Create a unique string based on timezone and timestamp
    const timezoneInfo = `${timezone}_${timezoneOffset}_${now.getTime()}`;
    
    // Generate a hash-like string from the timezone info
    let hash = 0;
    for (let i = 0; i < timezoneInfo.length; i++) {
      const char = timezoneInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create a UUID-like string with timezone info
    const timestamp = now.getTime();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timezoneHash = Math.abs(hash).toString(36).substr(0, 8);
    
    const uuid = `zone_${timestamp}_${timezoneHash}_${randomPart}`;
    
    console.log('🔧 Server generated timezone UUID:', {
      timezone,
      timezoneOffset,
      timestamp,
      timezoneHash,
      randomPart,
      uuid
    });
    
    return uuid;
  } catch (error) {
    console.error('Error generating timezone UUID on server:', error);
    // Fallback to simple timestamp-based UUID
    return `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const storage = {
  // User management functions
  async createUser(userData: Omit<InsertUser, 'applicantId'>): Promise<User> {
    const applicantId = generateTimezoneBasedUUID();
    const result = await db.insert(users).values({
      ...userData,
      applicantId,
    }).returning();
    return result[0];
  },

  async getUserByCognitoUsername(cognitoUsername: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.cognitoUsername, cognitoUsername));
    return result[0];
  },

  async getUserByApplicantId(applicantId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.applicantId, applicantId));
    return result[0];
  },

  async updateUser(applicantId: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== null && value !== undefined)
    );
    const result = await db
      .update(users)
      .set({ ...cleanData, updatedAt: new Date() })
      .where(eq(users.applicantId, applicantId))
      .returning();
    return result[0];
  },

  // Application management functions
  async getApplication(id: number): Promise<RentalApplication | undefined> {
    const result = await db.select().from(rentalApplications).where(eq(rentalApplications.id, id));
    return result[0];
  },

  async getApplicationsByApplicantId(applicantId: string): Promise<RentalApplication[]> {
    return await db.select().from(rentalApplications).where(eq(rentalApplications.applicantId, applicantId));
  },

  async createApplication(insertApplication: InsertRentalApplication): Promise<RentalApplication> {
    // Filter out null values and convert to proper format
    const cleanData = Object.fromEntries(
      Object.entries(insertApplication).filter(([_, value]) => value !== null && value !== undefined)
    );
    const result = await db.insert(rentalApplications).values(cleanData as any).returning();
    return result[0];
  },

  async updateApplication(id: number, updateData: Partial<InsertRentalApplication>): Promise<RentalApplication | undefined> {
    // Filter out null values and convert to proper format
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== null && value !== undefined)
    );
    const result = await db
      .update(rentalApplications)
      .set(cleanData as any)
      .where(eq(rentalApplications.id, id))
      .returning();
    return result[0];
  },

  async getAllApplications(): Promise<RentalApplication[]> {
    return await db.select().from(rentalApplications);
  }
};
