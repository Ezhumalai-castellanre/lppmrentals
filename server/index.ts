import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { insertRentalApplicationSchema } from "../shared/schema";
import crypto from "crypto";

const app = express();

// Increase payload limits for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(express.raw({ limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log request size for debugging
  if (path.startsWith("/api")) {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
      log(`Request size: ${sizeInMB}MB for ${req.method} ${path}`);
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});



// API Routes
app.post('/api/submit-application', async (req, res) => {
  try {
    log('=== SUBMIT-APPLICATION ENDPOINT CALLED ===');
    log('Request URL:', req.url);
    log('Request method:', req.method);
    log('Request headers:', JSON.stringify(req.headers, null, 2));

    // Check payload size for logging
    const contentLength = req.headers['content-length'];
    const payloadSizeMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'unknown';
    log(`Payload size: ${payloadSizeMB}MB`);

    const { applicationData, uploadedFilesMetadata } = req.body;

    if (!applicationData) {
      return res.status(400).json({ error: 'Missing application data' });
    }

    // Log the received data for debugging
    log('Received applicationData:', JSON.stringify(applicationData, null, 2));
    log('Received uploadedFilesMetadata:', JSON.stringify(uploadedFilesMetadata, null, 2));

    // Validate application data
    log('About to validate applicationData.applicantDob:', applicationData.applicantDob ? applicationData.applicantDob.toString() : 'null');
    log('About to validate applicationData.moveInDate:', applicationData.moveInDate ? applicationData.moveInDate.toString() : 'null');
    
    const validatedData = insertRentalApplicationSchema.parse(applicationData);
    
    log('Validation passed. validatedData.applicantDob:', validatedData.applicantDob ? validatedData.applicantDob.toString() : 'null');
    log('Validation passed. validatedData.moveInDate:', validatedData.moveInDate ? validatedData.moveInDate.toString() : 'null');

    // Create application in database
    const result = await storage.createApplication({
      ...validatedData,
      documents: uploadedFilesMetadata ? JSON.stringify(uploadedFilesMetadata) : undefined,
      encryptedData: undefined // No longer sending encrypted data to server
    });

    res.json({
      success: true,
      applicationId: result.id,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    log('Submit application error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/upload-files', async (req, res) => {
  try {
    log('=== UPLOAD-FILES ENDPOINT CALLED ===');
    
    const { files, personType } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid files data' });
    }

    if (!personType) {
      return res.status(400).json({ error: 'Missing person type' });
    }

    // Process uploaded files
    const processedFiles = files.map((file: any) => ({
      ...file,
      personType,
      uploadedAt: new Date().toISOString()
    }));



    res.json({
      success: true,
      files: processedFiles,
      message: `Files uploaded successfully for ${personType}`
    });

  } catch (error) {
    log('Upload files error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});





(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log specific payload size errors
    if (status === 413) {
      log(`Payload too large error: ${message}`);
      log(`Error details: ${JSON.stringify(err)}`);
    }

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 5001, or use a different port if 5001 is busy
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
  server.listen({
    port,
    host: "localhost", // Use localhost for local development
  }, () => {
    log(`serving on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is busy, trying port ${port + 1}`);
      server.listen({
        port: port + 1,
        host: "localhost", // Use localhost for local development
      }, () => {
        log(`serving on port ${port + 1}`);
      });
    } else {
      throw err;
    }
  });
})();
