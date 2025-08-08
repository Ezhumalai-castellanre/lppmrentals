import { saveDraft } from './dynamodb-service.js';

export const handler = async (event, context) => {
  console.log('🔄 Save draft function called');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📥 Parsing request body...');
    const requestBody = JSON.parse(event.body);
    console.log('✅ Request parsed successfully');

    // Handle new structure with form_data container
    let applicantId, formData, currentStep, isComplete;
    
    if (requestBody.form_data) {
      // New structure with form_data container
      applicantId = requestBody.applicantId;
      formData = requestBody.form_data;
      currentStep = requestBody.currentStep;
      isComplete = requestBody.isComplete || false;
    } else {
      // Legacy structure - backward compatibility
      applicantId = requestBody.applicantId;
      formData = requestBody.formData;
      currentStep = requestBody.currentStep;
      isComplete = requestBody.isComplete || false;
    }

    if (!applicantId) {
      console.log('❌ Missing applicantId');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' })
      };
    }

    console.log('🔄 Calling saveDraft function...');
    const result = await saveDraft(applicantId, formData, currentStep, isComplete);
    console.log('✅ Draft saved successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Error in save-draft function:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save draft',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 