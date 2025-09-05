"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('=== WEBHOOK PROXY FUNCTION CALLED ===');
    console.log('Path:', event.path);
    console.log('HTTP Method:', event.httpMethod);
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }
    if (event.path === '/monday-missing-subitems') {
        return handleMondayMissingSubitems(event);
    }
    if (event.path === '/monday-units') {
        return handleMondayUnits(event);
    }
    if (event.path === '/webhook-proxy') {
        return handleWebhookProxy(event);
    }
    return {
        statusCode: 404,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
            error: 'Endpoint not found',
            message: `Path ${event.path} is not supported`
        })
    };
};
exports.handler = handler;
async function handleMondayMissingSubitems(event) {
    console.log('🔍 Handling monday-missing-subitems request');
    try {
        const queryParams = event.queryStringParameters || {};
        const applicantId = queryParams.applicantId;
        if (!applicantId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            })
        };
    }
}
async function handleMondayUnits(event) {
    console.log('🏠 Handling monday-units request');
    try {
        const mockResponse = {
            success: true,
            units: [
                {
                    id: '1',
                    name: 'Unit 101',
                    status: 'available',
                    price: 1500
                },
                {
                    id: '2',
                    name: 'Unit 102',
                    status: 'occupied',
                    price: 1600
                }
            ],
            message: 'Units retrieved successfully'
        };
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify(mockResponse)
        };
    }
    catch (error) {
        console.error('❌ Error in monday-units function:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            })
        };
    }
}
async function handleWebhookProxy(event) {
    console.log('📤 Handling webhook-proxy request');
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Method not allowed',
                    message: 'Only POST requests are supported'
                })
            };
        }
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            console.error('❌ Failed to parse request body:', parseError);
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Invalid JSON',
                    message: 'Request body must be valid JSON'
                })
            };
        }
        const bodySize = event.body ? event.body.length : 0;
        const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
        console.log(`📦 Request body size: ${bodySizeMB}MB`);
        if (bodySize > 100 * 1024 * 1024) {
            console.log('❌ Request too large');
            return {
                statusCode: 413,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Request too large',
                    message: 'Request body exceeds 100MB limit'
                })
            };
        }
        const { webhookType, webhookData } = body;
        if (!webhookType || !webhookData) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Missing required fields',
                    message: 'webhookType and webhookData are required'
                })
            };
        }
        const FILE_WEBHOOK_URL = 'https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3';
        const FORM_WEBHOOK_URL = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';
        let webhookUrl;
        let webhookPayload;
        if (webhookType === 'file_upload') {
            webhookUrl = FILE_WEBHOOK_URL;
            webhookPayload = {
                reference_id: webhookData.reference_id,
                file_name: webhookData.file_name,
                section_name: webhookData.section_name,
                document_name: webhookData.document_name,
                s3_url: webhookData.s3_url,
                s3_key: webhookData.s3_key,
                file_size: webhookData.file_size,
                file_type: webhookData.file_type,
                application_id: webhookData.application_id,
                id: webhookData.id,  // ✅ Added missing ID field
                document_subitem_id: webhookData.id,  // Alternative field name
                comment_id: webhookData.comment_id,
                uploaded_at: webhookData.uploaded_at,
                file_base64: webhookData.file_base64,
                submission_type: webhookData.submission_type
            };
        }
        else if (webhookType === 'form_data') {
            webhookUrl = FORM_WEBHOOK_URL;
            webhookPayload = {
                reference_id: webhookData.reference_id,
                application_id: webhookData.application_id,
                form_data: webhookData.form_data,
            };
        }
        else {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Invalid webhook type',
                    message: 'webhookType must be either "file_upload" or "form_data"'
                })
            };
        }
        console.log(`📤 Sending ${webhookType} to webhook: ${webhookUrl}`);
        console.log(`📦 Payload size: ${JSON.stringify(webhookPayload).length} bytes`);
        console.log(`🆔 Document ID in payload: ${webhookPayload.id}`);
        console.log(`💬 Comment ID in payload: ${webhookPayload.comment_id}`);
        try {
            const { default: fetch } = await Promise.resolve().then(() => __importStar(require('node-fetch')));
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookPayload),
            });
            const responseBody = await webhookResponse.text();
            if (webhookResponse.ok) {
                console.log('✅ Webhook call successful');
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                    },
                    body: JSON.stringify({
                        success: true,
                        message: 'Webhook sent successfully',
                        webhookResponse: responseBody,
                        statusCode: webhookResponse.status
                    })
                };
            }
            else {
                console.error('❌ Webhook call failed:', webhookResponse.status, responseBody);
                return {
                    statusCode: webhookResponse.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Webhook call failed',
                        statusCode: webhookResponse.status,
                        responseBody: responseBody
                    })
                };
            }
        }
        catch (webhookError) {
            console.error('❌ Error calling webhook:', webhookError);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Webhook call failed',
                    message: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error'
                })
            };
        }
    }
    catch (error) {
        console.error('❌ Error in webhook proxy function:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            })
        };
    }
}
