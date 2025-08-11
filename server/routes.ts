import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRentalApplicationSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import CryptoJS from "crypto-js";
import fs from "fs";
import path from "path";

// Type for global draft storage
declare global {
  var draftStorage: Map<string, {
    applicantId: string;
    formData: any;
    lastUpdated: string;
    dataSize: number;
  }> | undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        message: "Server is running"
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // User registration endpoint
  app.post("/api/register-user", async (req, res) => {
    try {
      console.log('🔧 User registration request received:', req.body);
      const { cognitoUsername, email, firstName, lastName, phoneNumber } = req.body;
      
      // Validate required fields
      if (!cognitoUsername || !email) {
        console.log('❌ Missing required fields:', { cognitoUsername, email });
        return res.status(400).json({ 
          error: "Missing required fields: cognitoUsername and email are required" 
        });
      }

      // Check if user already exists
      console.log('🔍 Checking if user already exists:', cognitoUsername);
      const existingUser = await storage.getUserByCognitoUsername(cognitoUsername);
      if (existingUser) {
        console.log('✅ User already exists with applicantId:', existingUser.applicantId);
        return res.status(409).json({ 
          error: "User already exists with this Cognito username",
          applicantId: existingUser.applicantId
        });
      }

      // Create user with UUID-based Applicant ID
      console.log('🔧 Creating new user...');
      const user = await storage.createUser({
        cognitoUsername,
        email,
        firstName,
        lastName,
        phoneNumber,
      });

      console.log('✅ User created successfully with applicantId:', user.applicantId);
      res.status(201).json({ 
        message: "User registered successfully", 
        user: {
          applicantId: user.applicantId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error('❌ User registration error:', error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Get user by Applicant ID
  app.get("/api/users/:applicantId", async (req, res) => {
    try {
      const { applicantId } = req.params;
      const user = await storage.getUserByApplicantId(applicantId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        applicantId: user.applicantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get applications by Applicant ID
  app.get("/api/applications/user/:applicantId", async (req, res) => {
    try {
      const { applicantId } = req.params;
      const applications = await storage.getApplicationsByApplicantId(applicantId);
      res.json(applications);
    } catch (error) {
      console.error('Get applications by user error:', error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get all applications
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get single application
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  // Create new application
  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertRentalApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  // Update application
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const validatedData = insertRentalApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(id, validatedData);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Submit application (change status to submitted)
  app.post("/api/applications/:id/submit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const application = await storage.updateApplication(id, { 
        status: 'submitted',
      });
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      res.json({ message: "Application submitted successfully", application });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Submit application with webhook integration
  app.post("/api/submit-application", async (req, res) => {
    try {
      console.log('Received submission request:', JSON.stringify(req.body, null, 2));
      
      const { applicationData, files, signatures, encryptedData } = req.body;
      
      console.log('Files received:', JSON.stringify(files, null, 2));
      console.log('Files type:', typeof files);
      console.log('Files is array:', Array.isArray(files));
      console.log('Files length:', files ? files.length : 'null');
      console.log('Encrypted data received:', encryptedData ? 'Yes' : 'No');
      console.log('Raw encrypted data:', encryptedData);
      if (encryptedData) {
        console.log('Encrypted documents count:', Object.keys(encryptedData.documents || {}).length);
        console.log('All encrypted files count:', encryptedData.allEncryptedFiles ? encryptedData.allEncryptedFiles.length : 0);
        console.log('Document types:', Object.keys(encryptedData.documents || {}));
      }
      
      if (!applicationData) {
        console.error('No applicationData provided');
        return res.status(400).json({ error: "No application data provided" });
      }
      
      // Validate application data
      console.log('Validating application data...');
      const validatedData = insertRentalApplicationSchema.parse(applicationData);
      console.log('Validation successful:', validatedData);
      
      // Parse documents field if it exists
      let parsedFiles = [];
      if (validatedData.documents) {
        try {
          parsedFiles = JSON.parse(validatedData.documents);
          console.log('Parsed files from documents field:', JSON.stringify(parsedFiles, null, 2));
        } catch (error) {
          console.error('Error parsing documents field:', error);
        }
      }
      
      // Parse encrypted data field if it exists
      let parsedEncryptedData = null;
      if (validatedData.encryptedData) {
        try {
          parsedEncryptedData = JSON.parse(validatedData.encryptedData);
          console.log('Parsed encrypted data:', JSON.stringify(parsedEncryptedData, null, 2));
        } catch (error) {
          console.error('Error parsing encrypted data field:', error);
        }
      }
      
      // Store application in database
      console.log('Storing application in database...');
      const application = await storage.createApplication({
        ...validatedData,
        status: 'submitted'
      });
      console.log('Application stored successfully:', application);

      res.status(201).json({ 
        message: "Application submitted successfully", 
        application
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error('Application submission error:', error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });



  // Monday.com API proxy endpoint
  app.get("/api/monday/units", async (req, res) => {
    try {
      const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
      const BOARD_ID = "9769934634";

      const query = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  value
                  text
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Monday API error: ${response.status}`);
      }

      const result = await response.json();
      const items = result?.data?.boards?.[0]?.items_page?.items ?? [];

      const units = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        propertyName: item.column_values.find((c: any) => c.id === "text_mktkkbsb")?.text || "", // Address column
        unitType: item.column_values.find((c: any) => c.id === "color_mktkdvc5")?.text || "", // Unit Type column
        status: item.column_values.find((c: any) => c.id === "color_mktk40b8")?.text || "" // Marketing column as status
      }));

      res.json({ units });
    } catch (error) {
      console.error('Monday API proxy error:', error);
      res.status(500).json({ error: "Failed to fetch units from Monday.com" });
    }
  });

  // Monday.com vacant units with enhanced filtering and subitems endpoint
  app.get("/api/monday/vacant-units", async (req, res) => {
    try {
      const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
      const BOARD_ID = "9769934634";

      const query = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  value
                  text
                }
                subitems {
                  id
                  name
                  column_values {
                    id
                    value
                    text
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Monday API error: ${response.status}`);
      }

      const result = await response.json();
      const items = result?.data?.boards?.[0]?.items_page?.items ?? [];

      const units = items.map((item: any) => {
        // Extract images from subitems
        let images: any[] = [];
        if (item.subitems && item.subitems.length > 0) {
          images = item.subitems.map((subitem: any) => {
            const linkCol = subitem.column_values.find((col: any) => col.id === "link_mktkw42r");
            if (linkCol && linkCol.value) {
              try {
                const linkData = JSON.parse(linkCol.value);
                return {
                  url: linkData.url,
                  name: subitem.name,
                  id: subitem.id
                };
              } catch (e) {
                console.log('Error parsing link column value:', e);
                return null;
              }
            }
            return null;
          }).filter(Boolean);
        }

        // Extract amenities (long_text_mktkpv9y)
        const amenitiesCol = item.column_values.find((col: any) => col.id === "long_text_mktkpv9y");
        const amenities = amenitiesCol ? amenitiesCol.text : "";

        // Filter subitems by vacant status as requested
        const filteredSubitems = item.subitems.filter((sub: any) =>
          sub.column_values.find((cv: any) =>
            cv.id === "color_mkp7fmq4" && cv.text === "Vacant"
          )
        );

        return {
          id: item.id,
          name: item.name,
          propertyName: item.column_values.find((col: any) => col.id === "text_mktkkbsb")?.text || "", // Address column
          unitType: item.column_values.find((col: any) => col.id === "color_mktkdvc5")?.text || "", // Unit Type column
          status: item.column_values.find((col: any) => col.id === "color_mktk40b8")?.text || "", // Marketing column as status
          monthlyRent: item.column_values.find((col: any) => col.id === "numeric_mktkj4pm")?.text || "", // Rent column
          amenities: amenities,
          images: images,
          vacantSubitems: filteredSubitems.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            status: sub.column_values.find((cv: any) => cv.id === "status")?.label || 
                    sub.column_values.find((cv: any) => cv.id === "status")?.text || "",
            applicantType: sub.column_values.find((cv: any) => cv.id === "color_mksyqx5h")?.text || ""
          }))
        };
      });

      res.json({ units });
    } catch (error) {
      console.error('Monday API proxy error:', error);
      res.status(500).json({ error: "Failed to fetch vacant units from Monday.com" });
    }
  });

  // Monday.com available rentals endpoint
  app.get("/api/monday/available-rentals", async (req, res) => {
    try {
      const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
      const BOARD_ID = "9769934634";

      const query = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  value
                  text
                }
                subitems {
                  id
                  name
                  column_values {
                    id
                    value
                    text
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Monday API error: ${response.status}`);
      }

      const result = await response.json();
      const items = result?.data?.boards?.[0]?.items_page?.items ?? [];

      const rentals = items.map((item: any) => {
        // Extract amenities from long_text_mktkpv9y
        const amenitiesCol = item.column_values.find((col: any) => col.id === "long_text_mktkpv9y");
        const amenities = amenitiesCol ? amenitiesCol.text : "";

        // Extract media files from subitems
        const mediaFiles = item.subitems?.map((subitem: any) => {
          const linkCol = subitem.column_values.find((col: any) => col.id === "link_mktkw42r");
          if (linkCol && linkCol.value) {
            try {
              const linkData = JSON.parse(linkCol.value);
              // Clean the URL by removing newlines and extra whitespace
              const cleanUrl = linkData.url?.replace(/\n/g, '').replace(/\r/g, '').trim();
              
              console.log('Processing media file:', {
                name: subitem.name,
                originalUrl: linkData.url,
                cleanUrl: cleanUrl,
                isVideo: subitem.name.toLowerCase().includes('.mov') || 
                        subitem.name.toLowerCase().includes('.mp4') ||
                        subitem.name.toLowerCase().includes('.avi')
              });
              
              return {
                id: subitem.id,
                name: subitem.name,
                url: cleanUrl,
                type: linkData.text || "Media",
                isVideo: subitem.name.toLowerCase().includes('.mov') || 
                        subitem.name.toLowerCase().includes('.mp4') ||
                        subitem.name.toLowerCase().includes('.avi')
              };
            } catch (e) {
              console.log('Error parsing link column value:', e);
              return null;
            }
          }
          return null;
        }).filter(Boolean) || [];

        return {
          id: item.id,
          name: item.name,
          propertyName: item.column_values.find((col: any) => col.id === "color_mktk40b8")?.text || "", // Marketing column
          unitType: item.column_values.find((col: any) => col.id === "numeric_mktdfshe")?.text || "", // Bedrooms column
          status: item.column_values.find((col: any) => col.id === "color_mktk40b8")?.text || "", // Marketing column as status
          monthlyRent: item.column_values.find((col: any) => col.id === "numeric_mktkj4pm")?.text || "", // Rent column
          amenities: amenities,
          mediaFiles: mediaFiles
        };
      });

      res.json({ rentals });
    } catch (error) {
      console.error('Monday API proxy error:', error);
      res.status(500).json({ error: "Failed to fetch available rentals from Monday.com" });
    }
  });

  // Monday.com missing subitems endpoint
  app.get("/api/monday/missing-subitems/:applicantId", async (req, res) => {
    try {
      const { applicantId } = req.params;
      
      if (!applicantId) {
        return res.status(400).json({ error: 'Applicant ID is required' });
      }

      console.log('Searching for applicant ID:', applicantId);

      const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
      const BOARD_ID = "9602025981";

      const query = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page {
              items {
                id
                name
                column_values(ids: ["text_mksxyax3", "text_mksxn3da", "text_mksxdc76"]) {
                  id
                  text
                }
                subitems {
                  id
                  name
                  column_values(ids: ["status", "color_mksyqx5h"]) {
                    id
                    text
                    ... on StatusValue {
                      label
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Monday API error: ${response.status}`);
      }

      const result = await response.json();
      const items = result?.data?.boards?.[0]?.items_page?.items ?? [];
      
      console.log('📊 Found', items.length, 'total items in the board');
      
      // Debug: Log all column values for first item to see available columns
      if (items.length > 0) {
        console.log('🔍 Debug: Column values for first item:');
        items[0].column_values.forEach((cv: any) => {
          console.log(`  - Column ${cv.id}: ${cv.text}`);
        });
        
        if (items[0].subitems && items[0].subitems.length > 0) {
          console.log('🔍 Debug: Column values for first subitem:');
          items[0].subitems[0].column_values.forEach((cv: any) => {
            console.log(`  - Column ${cv.id}: ${cv.text} (label: ${cv.label || 'N/A'})`);
          });
        }
      }
      
      // Create a list of possible applicant IDs to search for
      const searchApplicantIds = [applicantId];
      
      // If the requested ID is in new Lppm format, also search for old format equivalents
      if (applicantId.startsWith('Lppm-')) {
        // Extract date and number from Lppm format
        const match = applicantId.match(/^Lppm-(\d{8})-(\d{5})$/);
        if (match) {
          const [, dateStr, numberStr] = match;
          const timestamp = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          ).getTime();
          
          // Create old format equivalents
          const oldZoneFormat = `zone_${timestamp}_${numberStr}`;
          const oldTempFormat = `temp_${timestamp}_${numberStr}`;
          
          searchApplicantIds.push(oldZoneFormat, oldTempFormat);
          console.log(`🔍 Also searching for old format equivalents: ${oldZoneFormat}, ${oldTempFormat}`);
        }
      }
      
      // If the requested ID is in old format, also search for new Lppm format
      if (applicantId.startsWith('zone_') || applicantId.startsWith('temp_')) {
        // Extract timestamp and number from old format
        const match = applicantId.match(/^(zone_|temp_)(\d+)_(.+)$/);
        if (match) {
          const [, prefix, timestamp, numberStr] = match;
          const date = new Date(parseInt(timestamp));
          const dateStr = date.getFullYear().toString() + 
                         String(date.getMonth() + 1).padStart(2, '0') + 
                         String(date.getDate()).padStart(2, '0');
          
          const newLppmFormat = `Lppm-${dateStr}-${numberStr.padStart(5, '0')}`;
          searchApplicantIds.push(newLppmFormat);
          console.log(`🔍 Also searching for new Lppm format: ${newLppmFormat}`);
        }
      }
      
      console.log(`🔍 Searching for applicant IDs: ${searchApplicantIds.join(', ')}`);
      
      // Find items matching any of the possible applicant IDs
      const matchingItems = items.filter((item: any) => {
        const itemApplicantId = item.column_values.find((cv: any) => cv.id === "text_mksxyax3")?.text;
        const matches = searchApplicantIds.includes(itemApplicantId);
        
        if (matches) {
          console.log(`✅ Found matching item: ${item.name} with applicant ID: ${itemApplicantId}`);
        }
        
        return matches;
      });

      console.log('📊 Found', matchingItems.length, 'items matching applicant ID', `"${applicantId}"`);

      const results = [];

      for (const item of matchingItems) {
        const parentItemId = item.id;
        const parentItemName = item.name;
        
        // Extract Co-Applicant and Guarantor names
        const coApplicantName = item.column_values.find((cv: any) => cv.id === "text_mksxn3da")?.text || null;
        const guarantorName = item.column_values.find((cv: any) => cv.id === "text_mksxdc76")?.text || null;
        
        console.log(`👥 Applicant: ${parentItemName}, Co-Applicant: ${coApplicantName}, Guarantor: ${guarantorName}`);
        
        const subitems = item.subitems || [];

        for (const sub of subitems) {
          const statusValue = sub.column_values.find((cv: any) => cv.id === "status");
          const status = statusValue?.label || statusValue?.text;
          const applicantType = sub.column_values.find((cv: any) => cv.id === "color_mksyqx5h")?.text || "Unknown";
          
          if (["Missing", "Received", "Rejected"].includes(status)) {
            results.push({
              id: sub.id,
              name: sub.name,
              status,
              parentItemId,
              parentItemName,
              applicantType,
              coApplicantName,
              guarantorName
            });
          }
        }
      }

      console.log('✅ Final Results:', results.length, 'missing subitems found');
      res.json(results);

    } catch (error) {
      console.error('Monday API proxy error:', error);
      res.status(500).json({ 
        error: "Failed to fetch missing subitems from Monday.com",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload encrypted files
  app.post("/api/upload-files", async (req, res) => {
    try {
      const { files, applicationId } = req.body;
      
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: "No files provided" });
      }

      const secretKey = process.env.ENCRYPTION_KEY || 'your-secret-key-change-in-production';
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadedFiles = [];

      for (const encryptedFile of files) {
        try {
          // Decrypt the file
          const bytes = CryptoJS.AES.decrypt(encryptedFile.encryptedData, secretKey);
          // Get the raw bytes directly instead of converting to UTF-8 string
          const base64Str = bytes.toString(CryptoJS.enc.Base64);
          const fileBuffer = Buffer.from(base64Str, 'base64');

          // Generate unique filename
          const timestamp = Date.now();
          const safeFilename = encryptedFile.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `${timestamp}_${safeFilename}`;
          const filePath = path.join(uploadDir, filename);

          // Save the decrypted file
          fs.writeFileSync(filePath, fileBuffer);

          uploadedFiles.push({
            originalName: encryptedFile.filename,
            savedName: filename,
            size: encryptedFile.originalSize,
            mimeType: encryptedFile.mimeType,
            uploadDate: encryptedFile.uploadDate,
            path: filePath
          });

        } catch (decryptError) {
          console.error(`Failed to decrypt file ${encryptedFile.filename}:`, decryptError);
          return res.status(400).json({ 
            error: `Failed to decrypt file ${encryptedFile.filename}` 
          });
        }
      }

      // Store file metadata in database (you can extend your schema to include this)
      // await storage.saveFileMetadata(applicationId, uploadedFiles);

      res.json({ 
        message: "Files uploaded successfully", 
        files: uploadedFiles,
        count: uploadedFiles.length
      });

    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // Draft management endpoints
  app.post("/api/drafts", async (req, res) => {
    try {
      console.log("✅ Received request to save draft:", new Date().toLocaleTimeString());
      
      const { applicantId, formData } = req.body;

      if (!applicantId || !formData) {
        return res.status(400).json({ error: 'applicantId and formData are required' });
      }

      // For local development, we'll store drafts in memory (you can extend this to use your database)
      // In production, this would use DynamoDB
      if (!global.draftStorage) {
        global.draftStorage = new Map();
      }

      // Check if the data size exceeds reasonable limits
      const dataSize = JSON.stringify(formData).length;
      if (dataSize > 1000000) { // 1MB limit for local development
        console.warn(`Draft data size (${dataSize} bytes) exceeds local limit`);
        return res.status(413).json({ 
          error: 'Draft data too large for local development',
          dataSize: dataSize
        });
      }

      // Store the draft
      global.draftStorage.set(applicantId, {
        applicantId,
        formData,
        lastUpdated: new Date().toISOString(),
        dataSize: dataSize
      });

      console.log(`✅ Draft saved for ${applicantId}, size: ${dataSize} bytes`);

      return res.status(200).json({ 
        message: 'Draft saved successfully',
        dataSize: dataSize
      });

    } catch (error) {
      console.error('Error saving draft:', error);
      
      return res.status(500).json({ 
        error: 'Could not save draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/drafts/:applicantId", async (req, res) => {
    try {
      const { applicantId } = req.params;
      console.log(`🔍 Looking for draft for applicant: ${applicantId}`);

      if (!global.draftStorage) {
        global.draftStorage = new Map();
      }

      const draft = global.draftStorage.get(applicantId);

      if (!draft) {
        console.log(`❌ No draft found for ${applicantId}`);
        return res.status(404).json({ message: 'Draft not found' });
      }

      console.log(`✅ Draft found for ${applicantId}, size: ${draft.dataSize} bytes`);

      return res.status(200).json({
        applicantId: draft.applicantId,
        formData: draft.formData,
        lastUpdated: draft.lastUpdated,
        dataSize: draft.dataSize
      });

    } catch (error) {
      console.error('Error loading draft:', error);
      
      return res.status(500).json({ 
        error: 'Could not load draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
