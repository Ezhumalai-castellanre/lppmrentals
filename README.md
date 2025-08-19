# LPPM Rentals Application

<!-- Deployment trigger: Fixing Netlify GitHub connectivity issue -->

A comprehensive rental application system built with React, TypeScript, and Netlify Functions.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RentalApplicationPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your local database configuration:
   ```env
   DATABASE_URL=postgresql://your-username:your-password@localhost:5432/rental_applications
   ENCRYPTION_KEY=your-secret-key-change-in-production-32-characters-long
   VITE_ENCRYPTION_KEY=your-secret-key-change-in-production-32-characters-long
   PORT=5000
   DEBUG=true
   MONDAY_API_TOKEN=your-monday-api-token-here
   MONDAY_BOARD_ID=9769934634
   MONDAY_DOCUMENTS_BOARD_ID=9602025981
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database schema changes

## Project Structure

- `client/` - React frontend application
- `server/` - Express backend server
- `shared/` - Shared TypeScript types and schemas
- `dist/` - Build output (generated)

## Features

- Rental application form with validation
- File upload and encryption
- PDF generation
- Database storage with Drizzle ORM
- TypeScript throughout the stack
- Missing documents tracking via Monday.com integration
- Separate missing documents page for document management

## Local Development Notes

- The application runs on `localhost:5000` by default
- Database should be running locally on PostgreSQL
- File uploads are stored locally
- All webhook functionality has been removed for local development

## Missing Documents Feature

The application includes a separate missing documents page that integrates with Monday.com to track document status:

- **Access**: Navigate to `/missing-documents` or click the "Missing Documents" button in the main application
- **Functionality**: Search for applicants by their unique ID to view missing documents
- **Integration**: Connects to Monday.com board to fetch real-time document status
- **API Endpoint**: `/api/monday/missing-subitems/:applicantId`

### Example Usage

1. Navigate to the missing documents page
2. Enter an applicant ID (e.g., `app_1752839426391_2041fkmmy`)
3. View the list of missing documents for that applicant
4. Upload missing documents directly from the page using the secure upload feature
5. See applicant information and document status summary
6. Use the refresh button to check for updated document status

### Upload Feature

The missing documents page now includes a secure upload feature:

- **Secure Upload**: Each missing document has its own upload section
- **File Encryption**: All uploaded files are encrypted before transmission
- **Supported Formats**: PDF, JPG, JPEG, PNG files up to 50MB
- **Real-time Status**: Upload progress and success indicators
- **Webhook Integration**: Files are automatically sent to the backend via webhook
- **Status Tracking**: Uploaded documents are marked with a green "Uploaded" badge

### URL Query Parameters

The missing documents page supports URL query parameters for direct access:

- **Direct Access**: Navigate to `/missing-documents?applicantId=app_1752839426391_2041fkmmy`
- **Auto-Search**: When an applicant ID is provided in the URL, the page automatically searches for missing documents
- **Shareable Links**: Use the "Share Link" button to copy a direct link to the current search results
- **URL Updates**: The URL automatically updates when searching to maintain shareable state

### Example URLs

```
# Direct access to specific applicant
http://localhost:5000/missing-documents?applicantId=app_1752839426391_2041fkmmy

# Clear search (no query parameters)
http://localhost:5000/missing-documents
``` 