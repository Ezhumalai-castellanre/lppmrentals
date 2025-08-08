# Netlify Deployment Guide

This guide will help you deploy your rental application to Netlify as a serverless application.

## Prerequisites

1. A Netlify account
2. Your application code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Environment variables configured

## Environment Variables

Set up the following environment variables in your Netlify dashboard:

### Required Environment Variables

1. **Database Configuration**
   - `DATABASE_URL` - Your PostgreSQL database connection string
   - `ENCRYPTION_KEY` - Secret key for file encryption (32+ characters)

2. **Monday.com Integration**
   - `MONDAY_API_TOKEN` - Your Monday.com API token
   - `MONDAY_BOARD_ID` - Your Monday.com board ID

### Optional Environment Variables

- `NODE_ENV` - Set to "production" for production builds

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Netlify dashboard
2. Click "New site from Git"
3. Choose your Git provider and select your repository
4. Configure the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
   - **Functions directory**: `netlify/functions`

### 2. Set Environment Variables

1. Go to Site settings > Environment variables
2. Add all the required environment variables listed above
3. Save the changes

### 3. Deploy

1. Netlify will automatically trigger a build when you push to your main branch
2. Monitor the build logs for any errors
3. Once deployed, your site will be available at `https://your-site-name.netlify.app`

## API Endpoints

Your application will have the following API endpoints available:

- `POST /api/submit-application` - Submit a rental application
- `POST /api/upload-files` - Upload files for an application
- `POST /api/monday-vacant-apartments` - Fetch vacant apartments from Monday.com
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get a specific application
- `POST /api/applications` - Create a new application
- `PATCH /api/applications/:id` - Update an application

## Local Development

To test the Netlify functions locally:

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Start the development server:
   ```bash
   netlify dev
   ```

This will start both your frontend and the Netlify functions locally.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are properly installed
   - Verify that the build command is correct
   - Check the build logs for specific error messages

2. **Function Errors**
   - Verify that all environment variables are set
   - Check the function logs in the Netlify dashboard
   - Ensure your database is accessible from Netlify's servers

3. **CORS Issues**
   - The functions include CORS headers, but you may need to adjust them for your domain
   - Update the `corsHeaders` in `netlify/functions/utils.js` if needed

### Database Considerations

- Ensure your database is accessible from external connections
- Consider using a managed database service (e.g., Supabase, PlanetScale, AWS RDS)
- Set up proper connection pooling for serverless environments

### File Storage

- For production, consider using a cloud storage service (Cloudinary, etc.)
- Update the file upload functions to use cloud storage instead of local file system

## Performance Optimization

1. **Function Optimization**
   - Keep functions lightweight and focused
   - Use connection pooling for database connections
   - Implement proper error handling

2. **Frontend Optimization**
   - Optimize bundle size
   - Use lazy loading for components
   - Implement proper caching strategies

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to your repository
   - Use Netlify's environment variable management
   - Rotate API keys regularly

2. **API Security**
   - Implement proper authentication if needed
   - Validate all input data
   - Use HTTPS for all communications

## Monitoring

1. **Function Monitoring**
   - Monitor function execution times
   - Set up alerts for function failures
   - Track API usage and performance

2. **Application Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor user experience metrics
   - Track application performance

## Support

If you encounter issues:

1. Check the Netlify documentation
2. Review the function logs in your Netlify dashboard
3. Test functions locally using `netlify dev`
4. Check your database connectivity and configuration 