// Common CORS headers for all functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
};

// Helper function to create CORS response
export const createCorsResponse = (statusCode, body, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: { ...corsHeaders, ...additionalHeaders },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

// Helper function to handle preflight requests
export const handlePreflight = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(200, '');
  }
  return null;
};

// Helper function to parse path parameters
export const parsePathParams = (path, pattern) => {
  const regex = new RegExp(pattern);
  const match = path.match(regex);
  return match ? match.groups : null;
};

// Helper function to validate required fields
export const validateRequiredFields = (body, requiredFields) => {
  const missing = requiredFields.filter(field => !body[field]);
  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }
  return { isValid: true };
};

// Helper function to prepare webhook payload with applicantId and zoneinfo mapping
export const prepareWebhookPayload = (applicationData, userInfo) => {
  const applicantId = userInfo.applicantId || userInfo.zoneinfo;
  const zoneinfo = userInfo.zoneinfo || userInfo.applicantId;

  return {
    ...applicationData,
    applicantId,
    zoneinfo,
    userInfo: {
      ...userInfo,
      applicantId,
      zoneinfo
    }
  };
};