// Mock schema for testing Netlify functions
// In production, this would import from the actual schema

import { z } from 'zod';

// Simple validation schema for testing
export const insertRentalApplicationSchema = z.object({
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email is required"),
  applicantPhone: z.string().optional(),
  applicantDob: z.string().or(z.date()).optional(),
  moveInDate: z.string().or(z.date()).optional(),
  propertyName: z.string().optional(),
  unitType: z.string().optional(),
  monthlyIncome: z.number().optional(),
  employmentStatus: z.string().optional(),
  // Add other fields as needed for testing
}).passthrough(); // Allow additional fields 