// Client-side DynamoDB service that uses API calls to Netlify functions

export interface UploadedDocument {
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  webhook_response: any;
  extracted_url: string;
  webhook_status: 'success' | 'error';
  webhook_status_code: number;
  comment_id?: string;
}

export class DynamoDBService {
  // Service methods will be added here as needed
}

export default DynamoDBService; 