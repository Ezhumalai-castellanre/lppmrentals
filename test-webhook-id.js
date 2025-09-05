// Test script to verify webhook proxy includes ID field
import https from 'https';

const WEBHOOK_PROXY_URL = 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/webhook-proxy';

const testPayload = {
  webhookType: 'file_upload',
  webhookData: {
    reference_id: 'TEST-ID-12345',
    file_name: 'test-document.pdf',
    section_name: 'test_section',
    document_name: 'Test Document',
    file_base64: '',
    application_id: 'TEST-ID-12345',
    id: 'TEST-DOCUMENT-ID-12345',  // This should be included in the response
    comment_id: 'TEST-COMMENT-12345',
    s3_url: 'https://test-bucket.s3.amazonaws.com/test-file.pdf',
    s3_key: 'test-file.pdf',
    file_size: 1024,
    file_type: 'application/pdf',
    uploaded_at: new Date().toISOString()
  }
};

console.log('🧪 Testing webhook proxy with ID field...');
console.log('📤 Sending test payload:');
console.log(JSON.stringify(testPayload, null, 2));

const postData = JSON.stringify(testPayload);

const options = {
  hostname: '9yo8506w4h.execute-api.us-east-1.amazonaws.com',
  path: '/prod/webhook-proxy',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📥 Response status: ${res.statusCode}`);
  console.log(`📥 Response headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response body:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Webhook proxy test successful!');
      console.log('🔍 Check the Make.com webhook to see if the ID field is included');
    } else {
      console.log('❌ Webhook proxy test failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Test error:', error);
});

req.write(postData);
req.end();
