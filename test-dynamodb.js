#!/usr/bin/env node

/**
 * Test script for DynamoDB service
 * This script tests the basic functionality of the DynamoDB service
 * Run with: node test-dynamodb.js
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, PutItemCommand, GetItemCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');

// Configuration - update these values
const config = {
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  tableName: process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved',
  // For testing, you can use local DynamoDB or provide AWS credentials
  // If using local DynamoDB, set endpoint: 'http://localhost:8000'
};

console.log('🧪 Testing DynamoDB Service Configuration');
console.log('📋 Configuration:', config);

// Create DynamoDB client
const dynamoDBClient = new DynamoDBClient({
  region: config.region,
  // Add credentials if not using IAM roles
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // }
});

async function testTableCreation() {
  console.log('\n📋 Testing table creation...');
  
  try {
    // Check if table exists
    try {
      await dynamoDBClient.send(new DescribeTableCommand({
        TableName: config.tableName,
      }));
      console.log(`✅ Table '${config.tableName}' already exists`);
      return true;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`📋 Table '${config.tableName}' does not exist, creating it...`);
      } else {
        throw error;
      }
    }

    // Create table
    const createTableCommand = new CreateTableCommand({
      TableName: config.tableName,
      AttributeDefinitions: [
        {
          AttributeName: 'applicantId',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'applicantId',
          KeyType: 'HASH' // Partition key
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    await dynamoDBClient.send(createTableCommand);
    console.log(`✅ Table '${config.tableName}' created successfully`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    let tableStatus = 'CREATING';
    while (tableStatus === 'CREATING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeResult = await dynamoDBClient.send(new DescribeTableCommand({
        TableName: config.tableName,
      }));
      tableStatus = describeResult.Table?.TableStatus;
      console.log(`📊 Table status: ${tableStatus}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating table:', error);
    return false;
  }
}

async function testTableSchema() {
  console.log('\n🔍 Testing table schema...');
  
  try {
    const describeResult = await dynamoDBClient.send(new DescribeTableCommand({
      TableName: config.tableName,
    }));
    
    const keySchema = describeResult.Table?.KeySchema || [];
    console.log('📋 Table key schema:', keySchema.map(k => ({
      name: k.AttributeName,
      type: k.KeyType
    })));
    
    // Verify the schema
    const hasApplicantIdPartitionKey = keySchema.some(k => 
      k.AttributeName === 'applicantId' && k.KeyType === 'HASH'
    );
    
    if (hasApplicantIdPartitionKey) {
      console.log('✅ Table has correct schema with applicantId as partition key');
      return true;
    } else {
      console.error('❌ Table does not have applicantId as partition key');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking table schema:', error);
    return false;
  }
}

async function testBasicOperations() {
  console.log('\n🧪 Testing basic DynamoDB operations...');
  
  const testApplicantId = 'TEST-LPPM-12345';
  const testReferenceId = 'TEST-REF-001';
  const testData = {
    applicantId: testApplicantId,
    reference_id: testReferenceId,
    form_data: { test: 'data', timestamp: new Date().toISOString() },
    current_step: 1,
    last_updated: new Date().toISOString(),
    status: 'draft'
  };
  
  try {
    // Test PUT operation
    console.log('📝 Testing PUT operation...');
    const putCommand = new PutItemCommand({
      TableName: config.tableName,
      Item: {
        applicantId: { S: testData.applicantId },
        reference_id: { S: testData.reference_id },
        form_data: { S: JSON.stringify(testData.form_data) },
        current_step: { N: testData.current_step.toString() },
        last_updated: { S: testData.last_updated },
        status: { S: testData.status }
      }
    });
    
    await dynamoDBClient.send(putCommand);
    console.log('✅ PUT operation successful');
    
    // Test GET operation
    console.log('📥 Testing GET operation...');
    const getCommand = new GetItemCommand({
      TableName: config.tableName,
      Key: {
        applicantId: { S: testApplicantId }
      }
    });
    
    const getResult = await dynamoDBClient.send(getCommand);
    if (getResult.Item) {
      console.log('✅ GET operation successful');
      console.log('📊 Retrieved data:', getResult.Item);
    } else {
      console.error('❌ GET operation failed - no item returned');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing basic operations:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete the test table
    const deleteCommand = new DeleteTableCommand({
      TableName: config.tableName,
    });
    
    await dynamoDBClient.send(deleteCommand);
    console.log(`✅ Table '${config.tableName}' deleted successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting DynamoDB service tests...\n');
  
  try {
    // Test 1: Table creation
    const tableCreated = await testTableCreation();
    if (!tableCreated) {
      console.error('❌ Table creation test failed');
      return;
    }
    
    // Test 2: Table schema
    const schemaCorrect = await testTableSchema();
    if (!schemaCorrect) {
      console.error('❌ Table schema test failed');
      return;
    }
    
    // Test 3: Basic operations
    const operationsWork = await testBasicOperations();
    if (!operationsWork) {
      console.error('❌ Basic operations test failed');
      return;
    }
    
    console.log('\n🎉 All tests passed! DynamoDB service is working correctly.');
    
    // Ask if user wants to clean up
    console.log('\n💡 The test table has been created and tested successfully.');
    console.log('💡 You can keep it for development or delete it manually from the AWS console.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    console.log('\n🏁 Test suite completed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTableCreation,
  testTableSchema,
  testBasicOperations,
  runTests
};
