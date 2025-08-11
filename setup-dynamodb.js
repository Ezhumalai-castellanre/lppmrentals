#!/usr/bin/env node

/**
 * DynamoDB Setup Script for Draft System
 * 
 * This script creates the DynamoDB table needed for the draft system.
 * Run this script after setting up your AWS credentials.
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Configuration - Update these values as needed
const config = {
  region: process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1',
  accessKeyId: process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT',
  secretAccessKey: process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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',
  tableName: process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved'
};

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

async function createTable() {
  try {
    console.log('🔧 Creating DynamoDB table for draft system...');
    console.log(`📍 Region: ${config.region}`);
    console.log(`📋 Table: ${config.tableName}`);
    
    const createTableCommand = new CreateTableCommand({
      TableName: config.tableName,
      KeySchema: [
        {
          AttributeName: 'applicantId',
          KeyType: 'HASH' // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'applicantId',
          AttributeType: 'S' // String
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
      GlobalSecondaryIndexes: [], // No GSIs needed for basic draft storage
      StreamSpecification: {
        StreamEnabled: false
      },
      Tags: [
        {
          Key: 'Purpose',
          Value: 'Rental Application Draft Storage'
        },
        {
          Key: 'Environment',
          Value: 'Production'
        }
      ]
    });

    const result = await client.send(createTableCommand);
    console.log('✅ Table created successfully!');
    console.log('📊 Table ARN:', result.TableDescription?.TableArn);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    await waitForTableActive();
    
    console.log('🎉 Setup complete! Your draft system is ready to use.');
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists. Checking status...');
      await checkTableStatus();
    } else {
      console.error('❌ Error creating table:', error.message);
      process.exit(1);
    }
  }
}

async function waitForTableActive() {
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 5 minutes
  
  while (attempts < maxAttempts) {
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: config.tableName
      });
      
      const result = await client.send(describeCommand);
      const status = result.Table?.TableStatus;
      
      if (status === 'ACTIVE') {
        console.log('✅ Table is now active!');
        return;
      }
      
      console.log(`⏳ Table status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      console.error('❌ Error checking table status:', error.message);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  throw new Error('Table did not become active within expected time');
}

async function checkTableStatus() {
  try {
    const describeCommand = new DescribeTableCommand({
      TableName: config.tableName
    });
    
    const result = await client.send(describeCommand);
    const status = result.Table?.TableStatus;
    const arn = result.Table?.TableArn;
    
    console.log('📊 Table Status:', status);
    console.log('🔗 Table ARN:', arn);
    
    if (status === 'ACTIVE') {
      console.log('✅ Table is active and ready to use!');
    } else {
      console.log('⚠️  Table is not yet active. Please wait and try again.');
    }
    
  } catch (error) {
    console.error('❌ Error checking table status:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 DynamoDB Setup for Draft System');
    console.log('=====================================\n');
    
    // Validate configuration
    if (!config.accessKeyId || !config.secretAccessKey) {
      console.error('❌ AWS credentials not found in environment variables');
      console.log('Please set the following environment variables:');
      console.log('- VITE_AWS_DYNAMODB_ACCESS_KEY_ID');
      console.log('- VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY');
      console.log('- VITE_AWS_DYNAMODB_REGION (optional, defaults to us-east-1)');
      console.log('- VITE_AWS_DYNAMODB_TABLE_NAME (optional, defaults to DraftSaved)');
      process.exit(1);
    }
    
    await createTable();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { createTable, checkTableStatus };
