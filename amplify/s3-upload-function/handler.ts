import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== S3 UPLOAD FUNCTION CALLED ===');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  
  try {
    // Check if it's a POST request
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Method not allowed',
          message: 'Only POST requests are supported'
        })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 50 * 1024 * 1024) { // 50MB limit
      console.log('❌ Request too large');
      return {
        statusCode: 413,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Request too large',
          message: 'Request body exceeds 50MB limit'
        })
      };
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
      console.error('❌ Missing required fields:', { fileData: !!fileData, fileName, referenceId, sectionName, documentName, zoneinfo: !!zoneinfo });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'fileData, fileName, referenceId, sectionName, documentName, and zoneinfo are required'
        })
      };
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'supportingdocuments-storage-2025';
    
    // Create folder structure using zoneinfo
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `documents/${zoneinfo}/${sectionName}/${timestamp}_${safeFileName}`;
    
    console.log(`🚀 Starting S3 upload: ${fileName} to ${key}`);
    console.log(`📁 Folder structure: documents/${zoneinfo}/${sectionName}/`);
    console.log(`📊 File size: ${(fileData.length / 1024 / 1024).toFixed(2)}MB`);

    try {
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
          sectionName: sectionName,
          documentName: documentName,
          zoneinfo: zoneinfo,
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
      console.log(`🔑 Presigned URL: ${presignedUrl}`);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          message: 'File uploaded successfully',
          url: cleanS3Url, // This is the clean URL
          presignedUrl: presignedUrl, // This is the presigned URL
          key: key,
          fileName: fileName,
          fileSize: buffer.length,
          uploadedAt: new Date().toISOString()
        })
      };

    } catch (uploadError) {
      console.error(`❌ S3 upload failed for ${fileName}:`, uploadError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'S3 upload failed',
          message: uploadError instanceof Error ? uploadError.message : 'Unknown upload error'
        })
      };
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};
