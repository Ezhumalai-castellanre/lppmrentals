const http = require('http');

// Test the local draft endpoints
async function testDraftEndpoints() {
  console.log('🧪 Testing local draft endpoints...\n');

  const testData = {
    applicantId: 'TEST-USER-001',
    formData: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message'
    }
  };

  // Test POST /api/drafts (save draft)
  console.log('📝 Testing POST /api/drafts...');
  try {
    const postData = JSON.stringify(testData);
    const postOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/drafts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const postReq = http.request(postOptions, (res) => {
      console.log(`📡 POST Response Status: ${res.statusCode}`);
      console.log(`📡 POST Response Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 POST Response Body:', data);
        console.log('');
        
        // After saving, test loading the draft
        testLoadDraft(testData.applicantId);
      });
    });

    postReq.on('error', (err) => {
      console.error('❌ POST Request Error:', err.message);
    });

    postReq.write(postData);
    postReq.end();

  } catch (error) {
    console.error('❌ POST Test Failed:', error);
  }
}

// Test GET /api/drafts/:applicantId (load draft)
async function testLoadDraft(applicantId) {
  console.log('📖 Testing GET /api/drafts/:applicantId...');
  try {
    const getOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/drafts/${applicantId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const getReq = http.request(getOptions, (res) => {
      console.log(`📡 GET Response Status: ${res.statusCode}`);
      console.log(`📡 GET Response Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 GET Response Body:', data);
        console.log('');
        
        if (res.statusCode === 200) {
          console.log('✅ Draft functionality test completed successfully!');
        } else {
          console.log('❌ Draft functionality test failed');
        }
      });
    });

    getReq.on('error', (err) => {
      console.error('❌ GET Request Error:', err.message);
    });

    getReq.end();

  } catch (error) {
    console.error('❌ GET Test Failed:', error);
  }
}

// Test health endpoint first
async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  try {
    const healthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    };

    const healthReq = http.request(healthOptions, (res) => {
      console.log(`📡 Health Response Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Health Response Body:', data);
        console.log('');
        
        if (res.statusCode === 200) {
          console.log('✅ Server is running, testing draft endpoints...\n');
          testDraftEndpoints();
        } else {
          console.log('❌ Server health check failed');
        }
      });
    });

    healthReq.on('error', (err) => {
      console.error('❌ Health Check Failed:', err.message);
      console.log('\n💡 Make sure your local server is running on port 3001');
      console.log('💡 Run: cd server && npm start (or node index.js)');
    });

    healthReq.end();

  } catch (error) {
    console.error('❌ Health Test Failed:', error);
  }
}

// Start testing
console.log('🚀 Starting local draft functionality test...\n');
testHealthEndpoint();
