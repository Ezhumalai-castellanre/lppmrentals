"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('=== MONDAY MISSING SUBITEMS FUNCTION CALLED ===');
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }
    try {
        const queryParams = event.queryStringParameters || {};
        const applicantId = queryParams.applicantId;
        if (!applicantId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Missing applicantId parameter',
                    message: 'applicantId is required'
                })
            };
        }
        console.log(`🔍 Looking for missing subitems for applicant: ${applicantId}`);
        const mockResponse = {
            success: true,
            applicantId: applicantId,
            missingSubitems: [
                {
                    id: '1',
                    name: 'Bank Statement',
                    status: 'missing',
                    section: 'financial_documents'
                },
                {
                    id: '2',
                    name: 'Pay Stubs',
                    status: 'missing',
                    section: 'employment_documents'
                }
            ],
            message: 'Missing subitems retrieved successfully'
        };
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify(mockResponse)
        };
    }
    catch (error) {
        console.error('❌ Error in monday-missing-subitems function:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            })
        };
    }
};
exports.handler = handler;
