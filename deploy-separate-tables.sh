#!/bin/bash

# Deploy Separate Tables DynamoDB Structure
# This script deploys the new separate tables structure

set -e

echo "🚀 Deploying Separate Tables DynamoDB Structure"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS credentials are configured
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS credentials not configured or invalid"
        print_status "Please run 'aws configure' or set environment variables:"
        print_status "  - AWS_ACCESS_KEY_ID"
        print_status "  - AWS_SECRET_ACCESS_KEY"
        print_status "  - AWS_DEFAULT_REGION"
        exit 1
    fi
    
    print_success "AWS credentials are valid"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    if [ -z "$VITE_AWS_DYNAMODB_ACCESS_KEY_ID" ] || [ -z "$VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY" ]; then
        print_error "Required environment variables not set"
        print_status "Please set the following environment variables:"
        print_status "  - VITE_AWS_DYNAMODB_ACCESS_KEY_ID"
        print_status "  - VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY"
        print_status "  - VITE_AWS_DYNAMODB_REGION (optional, defaults to us-east-1)"
        exit 1
    fi
    
    print_success "Environment variables are set"
}

# Create DynamoDB tables
create_tables() {
    print_status "Creating DynamoDB tables..."
    
    if [ ! -f "setup-dynamodb-separate-tables.js" ]; then
        print_error "setup-dynamodb-separate-tables.js not found"
        exit 1
    fi
    
    node setup-dynamodb-separate-tables.js
    
    if [ $? -eq 0 ]; then
        print_success "DynamoDB tables created successfully"
    else
        print_error "Failed to create DynamoDB tables"
        exit 1
    fi
}

# Deploy Amplify backend
deploy_amplify_backend() {
    print_status "Deploying Amplify backend with new table configurations..."
    
    if [ ! -f "amplify/backend.ts" ]; then
        print_error "amplify/backend.ts not found"
        exit 1
    fi
    
    # Check if npx is available
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js and npm"
        exit 1
    fi
    
    # Deploy Amplify backend
    npx ampx sandbox deploy
    
    if [ $? -eq 0 ]; then
        print_success "Amplify backend deployed successfully"
    else
        print_error "Failed to deploy Amplify backend"
        exit 1
    fi
}

# Migrate existing data (optional)
migrate_data() {
    print_warning "Data migration is available but not automatically run"
    print_status "To migrate existing data, run:"
    print_status "  node migrate-to-separate-tables.js"
    print_status ""
    print_status "This will migrate data from the old 'DraftSaved' table to the new separate tables"
    print_status "Make sure to backup your data before running the migration"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if tables exist
    aws dynamodb list-tables --query 'TableNames[?contains(@, `app_nyc`) || contains(@, `applicant_nyc`) || contains(@, `Co-Applicants`) || contains(@, `Guarantors_nyc`)]' --output table
    
    if [ $? -eq 0 ]; then
        print_success "Deployment verification completed"
    else
        print_warning "Could not verify all tables exist"
    fi
}

# Main deployment process
main() {
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    # Step 1: Check prerequisites
    check_aws_credentials
    check_environment
    echo ""
    
    # Step 2: Create tables
    create_tables
    echo ""
    
    # Step 3: Deploy Amplify backend
    deploy_amplify_backend
    echo ""
    
    # Step 4: Verify deployment
    verify_deployment
    echo ""
    
    # Step 5: Migration information
    migrate_data
    echo ""
    
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    print_status "1. Test the new separate tables structure"
    print_status "2. Update your application code to use the new service"
    print_status "3. Run data migration if needed"
    print_status "4. Deploy your updated application"
    echo ""
}

# Run main function
main "$@"
