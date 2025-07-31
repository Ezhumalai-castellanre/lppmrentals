import { db, rentalApplications, users } from './db';
import { eq } from 'drizzle-orm';
import type { RentalApplication, InsertRentalApplication, User, InsertUser } from '@shared/schema';
import { randomUUID } from 'crypto';

/**
 * Generate a Lppm-number format ID for ApplicantId
 * Format: Lppm-YYYYMMDD-XXXXX (where XXXXX is a 5-digit sequential number)
 */
function generateLppmNumber(): string {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Generate a 5-digit sequential number based on timestamp
    const timestamp = now.getTime();
    const sequentialNumber = (timestamp % 100000).toString().padStart(5, '0');
    
    const lppmNumber = `Lppm-${dateString}-${sequentialNumber}`;
    
    console.log('🔧 Server generated Lppm number:', {
      dateString,
      sequentialNumber,
      lppmNumber
    });
    
    return lppmNumber;
  } catch (error) {
    console.error('Error generating Lppm number on server:', error);
    // Fallback to simple timestamp-based Lppm number
    const fallbackDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fallbackNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `Lppm-${fallbackDate}-${fallbackNumber}`;
  }
}

/**
 * Generate a timezone-based UUID for ApplicantId
 * Uses timezone information to create a unique identifier
 * @deprecated Use generateLppmNumber() instead
 */
function generateTimezoneBasedUUID(): string {
  // Use the new Lppm number format instead
  return generateLppmNumber();
}

export const storage = {
  // User management functions
  async createUser(userData: Omit<InsertUser, 'applicantId'>): Promise<User> {
    const applicantId = generateLppmNumber();
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
