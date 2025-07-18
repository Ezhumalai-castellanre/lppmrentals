import { db, rentalApplications } from './db';
import { eq } from 'drizzle-orm';
import type { RentalApplication, InsertRentalApplication } from '@shared/schema';

export const storage = {
  async getApplication(id: number): Promise<RentalApplication | undefined> {
    const result = await db.select().from(rentalApplications).where(eq(rentalApplications.id, id));
    return result[0];
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
