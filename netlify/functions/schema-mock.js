// Mock schema for testing Netlify functions
// In production, this would import from the actual schema

import { z } from 'zod';

// Helper function to convert string dates to Date objects
const dateStringToDate = z.string().or(z.date()).or(z.null()).transform((val) => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'string') {
    return new Date(val);
  }
  return val;
});

// Simple validation schema for testing - includes all fields
export const insertRentalApplicationSchema = z.any(); 