import { storage } from './storage-mock.js';
import { insertRentalApplicationSchema } from './schema.js';
import { z } from 'zod';
import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  try {
    // GET /api/applications - Get all applications
    if (event.httpMethod === 'GET' && event.path === '/api/applications') {
      const applications = await storage.getAllApplications();
      return createCorsResponse(200, applications);
    }

    // GET /api/applications/:id - Get single application
    if (event.httpMethod === 'GET' && event.path.match(/^\/api\/applications\/\d+$/)) {
      const id = parseInt(event.path.split('/').pop());
      if (isNaN(id)) {
        return createCorsResponse(400, { error: "Invalid application ID" });
      }

      const application = await storage.getApplication(id);
      if (!application) {
        return createCorsResponse(404, { error: "Application not found" });
      }

      return createCorsResponse(200, application);
    }

    // POST /api/applications - Create new application
    if (event.httpMethod === 'POST' && event.path === '/api/applications') {
      const body = JSON.parse(event.body);
      const validatedData = insertRentalApplicationSchema.parse(body);
      const application = await storage.createApplication(validatedData);
      
      return createCorsResponse(201, application);
    }

    // PATCH /api/applications/:id - Update application
    if (event.httpMethod === 'PATCH' && event.path.match(/^\/api\/applications\/\d+$/)) {
      const id = parseInt(event.path.split('/').pop());
      if (isNaN(id)) {
        return createCorsResponse(400, { error: "Invalid application ID" });
      }

      const body = JSON.parse(event.body);
      const validatedData = insertRentalApplicationSchema.partial().parse(body);
      const application = await storage.updateApplication(id, validatedData);
      
      if (!application) {
        return createCorsResponse(404, { error: "Application not found" });
      }

      return createCorsResponse(200, application);
    }

    // Method not allowed
    return createCorsResponse(405, { error: 'Method not allowed' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createCorsResponse(400, { 
        error: "Validation failed", 
        details: error.errors 
      });
    }

    console.error('Applications API error:', error);
    return createCorsResponse(500, { error: "Internal server error" });
  }
}; 