import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

      if (event.httpMethod !== 'POST') {
      return createCorsResponse(405, { error: 'Method not allowed' });
    }

  try {
    console.log('=== UPLOAD-FILES FUNCTION CALLED ===');
    
    const body = JSON.parse(event.body);
    const { files, personType } = body;

    if (!files || !Array.isArray(files)) {
      return createCorsResponse(400, { error: 'Invalid files data' });
    }

    if (!personType) {
      return createCorsResponse(400, { error: 'Missing person type' });
    }

    // Process uploaded files and prepare webhook data
    const processedFiles = files.map((file) => ({
      ...file,
      personType,
      uploadedAt: new Date().toISOString(),
      status: 'processed',
      documentId: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Prepare webhook response data
    const webhookResponse = {
      success: true,
      statusCode: 200,
      requestId: context.awsRequestId || `req_${Date.now()}`,
      data: {
        documents: processedFiles.map(file => ({
          documentId: file.documentId,
          fileName: file.name,
          personType: file.personType,
          metadata: {
            uploadedAt: file.uploadedAt,
            processingStatus: 'COMPLETED',
            documentType: file.type,
            mimeType: file.type,
            size: file.size,
            checksum: file.checksum || null
          },
          status: {
            code: 'UPLOAD_SUCCESS',
            message: 'Document successfully processed'
          }
        })),
        summary: {
          totalDocuments: processedFiles.length,
          totalSize: processedFiles.reduce((acc, file) => acc + (file.size || 0), 0),
          personType: personType,
          batchId: `batch_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'COMPLETE'
        }
      },
      message: `Successfully processed ${processedFiles.length} documents for ${personType}`
    };

    // Log webhook success details for monitoring
    console.log('=== 📤 WEBHOOK RESPONSE LOG ===');
    console.log('✅ Status: Document Upload Successful');
    console.log('� Request ID:', webhookResponse.requestId);
    console.log('📦 Batch Details:');
    console.log('   • Batch ID:', webhookResponse.data.summary.batchId);
    console.log('   • Total Documents:', processedFiles.length);
    console.log('   • Total Size:', `${Math.round(webhookResponse.data.summary.totalSize / 1024)} KB`);
    console.log('   • Person Type:', personType);
    console.log('   • Timestamp:', webhookResponse.data.summary.timestamp);
    console.log('📄 Documents processed:');
    webhookResponse.data.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.fileName}`);
      console.log(`      • Document ID: ${doc.documentId}`);
      console.log(`      • Status: ${doc.status.code}`);
      console.log(`      • Type: ${doc.metadata.documentType}`);
      console.log(`      • Size: ${Math.round(doc.metadata.size / 1024)} KB`);
    });
    console.log('📨 Webhook Response Body:');
    console.log(JSON.stringify(webhookResponse, null, 2));
    console.log('=== END WEBHOOK RESPONSE LOG ===');

    // Add CORS headers and return success response
    return createCorsResponse(200, webhookResponse);

  } catch (error) {
    console.error('❌ Upload files error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Prepare error webhook response
    const errorResponse = {
      success: false,
      statusCode: error.statusCode || 500,
      error: {
        code: error.code || 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error.details || {},
        timestamp: new Date().toISOString()
      }
    };

    // Log error for monitoring
    console.error('❌ Upload webhook error response:', JSON.stringify(errorResponse, null, 2));
    
    return createCorsResponse(errorResponse.statusCode, errorResponse);
  }
}; 