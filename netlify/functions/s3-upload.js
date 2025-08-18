import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== S3 UPLOAD FUNCTION CALLED ===');
    
    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 50 * 1024 * 1024) { // 50MB limit
      console.log('❌ Request too large');
      return createCorsResponse(413, { 
        error: 'Request too large', 
        message: 'Request body exceeds 50MB limit' 
      });
    }

    // Parse JSON body
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
      console.log('📋 Received body keys:', Object.keys(body));
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      return createCorsResponse(400, { 
        error: 'Malformed JSON', 
        message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error'
      });
    }

          // Extract required fields
      const { 
        fileData, 
        fileName, 
        fileType, 
        referenceId, 
        sectionName, 
        documentName,
        zoneinfo 
      } = body;

      if (!fileData || !fileName || !referenceId || !sectionName || !documentName || !zoneinfo) {
        console.error('❌ Missing required fields');
        return createCorsResponse(400, { 
          error: 'Missing required fields',
          message: 'fileData, fileName, referenceId, sectionName, documentName, and zoneinfo are required'
        });
      }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'supportingdocuments-storage-2025';

          // Generate unique key for the file using zoneinfo as the main folder
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `documents/${zoneinfo}/${sectionName}/${timestamp}_${safeFileName}`;
      
      console.log(`🚀 Starting S3 upload: ${fileName} to ${key}`);
      console.log(`📊 File size: ${(fileData.length / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📁 Using zoneinfo folder: ${zoneinfo}`);

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: fileType || 'application/octet-stream',
              Metadata: {
          originalName: fileName,
          referenceId: referenceId,
          zoneinfo: zoneinfo,
          sectionName: sectionName,
          documentName: documentName,
          uploadedAt: new Date().toISOString(),
        },
    });

    await s3Client.send(uploadCommand);
    
          // Generate clean S3 URL and presigned URL
      const cleanS3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 hour

      console.log(`✅ S3 upload successful: ${fileName}`);
      console.log(`🔗 Clean S3 URL: ${cleanS3Url}`);
      console.log(`🔗 Presigned URL: ${presignedUrl}`);

      return createCorsResponse(200, {
        success: true,
        url: cleanS3Url, // Return clean URL by default
        presignedUrl: presignedUrl, // Also provide presigned URL if needed
        key: key,
        fileName: fileName,
        fileSize: buffer.length,
      });

  } catch (error) {
    console.error('❌ S3 upload error:', error instanceof Error ? error.message : 'Unknown error');
    
    return createCorsResponse(500, {
      success: false,
      error: 'S3 upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
