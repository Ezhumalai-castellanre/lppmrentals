// Test script to verify the missing documents function fix

// Test the function with both GET and POST methods
async function testFunction() {
  console.log('🧪 Testing Missing Documents Function...\n');
  
  // Test 1: GET request (should work)
  console.log('📡 Test 1: GET request');
  try {
    const getResponse = await fetch('https://jotform-v.netlify.app/.netlify/functions/monday-missing-subitems', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('GET Response Status:', getResponse.status);
    const getData = await getResponse.text();
    console.log('GET Response:', getData.substring(0, 200) + '...');
  } catch (error) {
    console.log('GET Error:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: POST request (should now work)
  console.log('📡 Test 2: POST request');
  try {
    const postResponse = await fetch('https://jotform-v.netlify.app/.netlify/functions/monday-missing-subitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicantId: 'test-applicant-id' })
    });
    
    console.log('POST Response Status:', postResponse.status);
    const postData = await postResponse.text();
    console.log('POST Response:', postData.substring(0, 200) + '...');
  } catch (error) {
    console.log('POST Error:', error.message);
  }
  
  console.log('\n✅ Test completed!');
}

// Run the test
testFunction();
