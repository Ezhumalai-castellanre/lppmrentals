const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  console.log('=== S3 UPLOAD LAMBDA FUNCTION CALLED ===');
  
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
      body = JSON.parse(event.body);
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
      console.error('❌ Missing required fields');
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
        url: cleanS3Url,
        presignedUrl: presignedUrl,
        key: key,
        fileName: fileName,
        fileSize: buffer.length,
      })
    };

  } catch (error) {
    console.error('❌ S3 upload error:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'S3 upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
