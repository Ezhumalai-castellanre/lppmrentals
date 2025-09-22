#!/usr/bin/env node

/**
 * Test Script: Separate Tables Integration
 * 
 * This script tests the integration between the application form
 * and the new separate DynamoDB tables structure.
 */

const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Configuration
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

// Test functions
async function testTableExists(tableName) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 1
    });
    
    await client.send(command);
    console.log(`✅ Table ${tableName} exists and is accessible`);
    return true;
  } catch (error) {
    console.log(`❌ Table ${tableName} error:`, error.message);
    return false;
  }
}

async function testDataStructure(tableName) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 5
    });
    
    const result = await client.send(command);
    const items = result.Items || [];
    
    console.log(`📊 Table ${tableName}:`);
    console.log(`  - Items found: ${items.length}`);
    
    if (items.length > 0) {
      const sampleItem = unmarshall(items[0]);
      console.log(`  - Sample item keys:`, Object.keys(sampleItem));
      
      // Check for required fields based on table type
      if (tableName === config.tables.app_nyc) {
        const hasAppid = 'appid' in sampleItem;
        const hasZoneinfo = 'zoneinfo' in sampleItem;
        console.log(`  - Has appid: ${hasAppid}`);
        console.log(`  - Has zoneinfo: ${hasZoneinfo}`);
      } else {
        const hasUserId = 'userId' in sampleItem;
        const hasZoneinfo = 'zoneinfo' in sampleItem;
        console.log(`  - Has userId: ${hasUserId}`);
        console.log(`  - Has zoneinfo: ${hasZoneinfo}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error scanning table ${tableName}:`, error.message);
    return false;
  }
}

async function testApplicationFormIntegration() {
  console.log('🧪 Testing Application Form Integration');
  console.log('=====================================\n');
  
  // Test all tables exist
  console.log('1. Testing table existence...');
  const tableResults = {};
  
  for (const [key, tableName] of Object.entries(config.tables)) {
    tableResults[key] = await testTableExists(tableName);
  }
  
  console.log('\n2. Testing data structure...');
  for (const [key, tableName] of Object.entries(config.tables)) {
    if (tableResults[key]) {
      await testDataStructure(tableName);
      console.log('');
    }
  }
  
  // Summary
  console.log('📋 Integration Test Summary:');
  console.log('============================');
  
  const allTablesExist = Object.values(tableResults).every(exists => exists);
  
  Object.entries(tableResults).forEach(([key, exists]) => {
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${key}: ${exists ? 'OK' : 'Failed'}`);
  });
  
  if (allTablesExist) {
    console.log('\n🎉 All tables are accessible! Application form integration should work.');
    console.log('\nNext steps:');
    console.log('1. Test the application form in the browser');
    console.log('2. Try saving a draft');
    console.log('3. Try loading a draft');
    console.log('4. Try submitting an application');
  } else {
    console.log('\n⚠️ Some tables are not accessible. Please check your configuration.');
  }
  
  return allTablesExist;
}

async function main() {
  try {
    console.log('🚀 Separate Tables Integration Test');
    console.log('===================================\n');
    
    // Validate configuration
    if (!config.accessKeyId || !config.secretAccessKey) {
      console.error('❌ AWS credentials not found in environment variables');
      console.log('Please set the following environment variables:');
      console.log('- VITE_AWS_DYNAMODB_ACCESS_KEY_ID');
      console.log('- VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY');
      console.log('- VITE_AWS_DYNAMODB_REGION (optional, defaults to us-east-1)');
      process.exit(1);
    }
    
    await testApplicationFormIntegration();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testApplicationFormIntegration, testTableExists, testDataStructure };
