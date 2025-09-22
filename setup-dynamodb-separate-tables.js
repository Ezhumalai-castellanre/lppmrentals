#!/usr/bin/env node

/**
 * DynamoDB Setup Script for Separate Tables System
 * 
 * This script creates the separate DynamoDB tables needed for the new data structure:
 * - app_nyc: Application Information
 * - applicant_nyc: Primary Applicant data
 * - Co-Applicants: Co-Applicant data
 * - Guarantors_nyc: Guarantor data
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

// Configuration - Update these values as needed
const config = {
  region: process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1',
  accessKeyId: process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY,
  tables: {
    app_nyc: 'app_nyc',
    applicant_nyc: 'applicant_nyc',
    coapplicants: 'Co-Applicants',
    guarantors: 'Guarantors_nyc'
  }
};

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

// Table definitions
const tableDefinitions = {
  app_nyc: {
    TableName: config.tables.app_nyc,
    KeySchema: [
      {
        AttributeName: 'appid',
        KeyType: 'HASH' // Partition key
      },
      {
        AttributeName: 'zoneinfo',
        KeyType: 'RANGE' // Sort key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'appid',
        AttributeType: 'S' // String
      },
      {
        AttributeName: 'zoneinfo',
        AttributeType: 'S' // String
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Purpose',
        Value: 'Application Information Storage'
      },
      {
        Key: 'Environment',
        Value: 'Production'
      }
    ]
  },
  applicant_nyc: {
    TableName: config.tables.applicant_nyc,
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH' // Partition key
      },
      {
        AttributeName: 'zoneinfo',
        KeyType: 'RANGE' // Sort key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S' // String
      },
      {
        AttributeName: 'zoneinfo',
        AttributeType: 'S' // String
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Purpose',
        Value: 'Primary Applicant Data Storage'
      },
      {
        Key: 'Environment',
        Value: 'Production'
      }
    ]
  },
  coapplicants: {
    TableName: config.tables.coapplicants,
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH' // Partition key
      },
      {
        AttributeName: 'zoneinfo',
        KeyType: 'RANGE' // Sort key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S' // String
      },
      {
        AttributeName: 'zoneinfo',
        AttributeType: 'S' // String
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Purpose',
        Value: 'Co-Applicant Data Storage'
      },
      {
        Key: 'Environment',
        Value: 'Production'
      }
    ]
  },
  guarantors: {
    TableName: config.tables.guarantors,
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH' // Partition key
      },
      {
        AttributeName: 'zoneinfo',
        KeyType: 'RANGE' // Sort key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S' // String
      },
      {
        AttributeName: 'zoneinfo',
        AttributeType: 'S' // String
      }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      {
        Key: 'Purpose',
        Value: 'Guarantor Data Storage'
      },
      {
        Key: 'Environment',
        Value: 'Production'
      }
    ]
  }
};

async function createTable(tableName, tableDef) {
  try {
    console.log(`🔧 Creating DynamoDB table: ${tableName}...`);
    
    const createTableCommand = new CreateTableCommand(tableDef);
    const result = await client.send(createTableCommand);
    
    console.log(`✅ Table ${tableName} created successfully!`);
    console.log(`📊 Table ARN: ${result.TableDescription?.TableArn}`);
    
    // Wait for table to be active
    console.log(`⏳ Waiting for table ${tableName} to become active...`);
    await waitForTableActive(tableName);
    
    return true;
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  Table ${tableName} already exists. Checking status...`);
      await checkTableStatus(tableName);
      return true;
    } else {
      console.error(`❌ Error creating table ${tableName}:`, error.message);
      return false;
    }
  }
}

async function waitForTableActive(tableName) {
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 5 minutes
  
  while (attempts < maxAttempts) {
    try {
      const describeCommand = new DescribeTableCommand({
        TableName: tableName
      });
      
      const result = await client.send(describeCommand);
      const status = result.Table?.TableStatus;
      
      if (status === 'ACTIVE') {
        console.log(`✅ Table ${tableName} is now active!`);
        return;
      }
      
      console.log(`⏳ Table ${tableName} status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      console.error(`❌ Error checking table ${tableName} status:`, error.message);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  throw new Error(`Table ${tableName} did not become active within expected time`);
}

async function checkTableStatus(tableName) {
  try {
    const describeCommand = new DescribeTableCommand({
      TableName: tableName
    });
    
    const result = await client.send(describeCommand);
    const status = result.Table?.TableStatus;
    const arn = result.Table?.TableArn;
    
    console.log(`📊 Table ${tableName} Status:`, status);
    console.log(`🔗 Table ${tableName} ARN:`, arn);
    
    if (status === 'ACTIVE') {
      console.log(`✅ Table ${tableName} is active and ready to use!`);
    } else {
      console.log(`⚠️  Table ${tableName} is not yet active. Please wait and try again.`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking table ${tableName} status:`, error.message);
  }
}

async function createAllTables() {
  console.log('🚀 Creating all DynamoDB tables for separate data structure');
  console.log('========================================================\n');
  
  const results = {};
  
  for (const [tableKey, tableDef] of Object.entries(tableDefinitions)) {
    const success = await createTable(tableDef.TableName, tableDef);
    results[tableKey] = success;
    console.log(''); // Add spacing between tables
  }
  
  // Summary
  console.log('📋 Creation Summary:');
  console.log('===================');
  Object.entries(results).forEach(([tableKey, success]) => {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${tableKey}: ${success ? 'Created/Exists' : 'Failed'}`);
  });
  
  const allSuccess = Object.values(results).every(success => success);
  
  if (allSuccess) {
    console.log('\n🎉 All tables are ready! Your separate data structure is set up.');
  } else {
    console.log('\n⚠️  Some tables failed to create. Please check the errors above.');
  }
  
  return allSuccess;
}

async function main() {
  try {
    // Validate configuration
    if (!config.accessKeyId || !config.secretAccessKey) {
      console.error('❌ AWS credentials not found in environment variables');
      console.log('Please set the following environment variables:');
      console.log('- VITE_AWS_DYNAMODB_ACCESS_KEY_ID');
      console.log('- VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY');
      console.log('- VITE_AWS_DYNAMODB_REGION (optional, defaults to us-east-1)');
      process.exit(1);
    }
    
    await createAllTables();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { createAllTables, createTable, checkTableStatus };
