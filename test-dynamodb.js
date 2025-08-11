// Test DynamoDB connection and table structure
import { DynamoDBClient, DescribeTableCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';

async function testDynamoDB() {
  const client = new DynamoDBClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'AKIA35BCK6ZHZC4EWVHT',
      secretAccessKey: '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',
    },
  });

  const tableName = 'DraftSaved';

  try {
    console.log('🧪 Testing DynamoDB connection...');
    
    // Try to describe the table
    const describeResult = await client.send(new DescribeTableCommand({
      TableName: tableName,
    }));
    
    console.log('✅ Table exists:', describeResult.Table.TableName);
    console.log('📋 Table schema:', {
      partitionKey: describeResult.Table.KeySchema.find(k => k.KeyType === 'HASH')?.AttributeName,
      sortKey: describeResult.Table.KeySchema.find(k => k.KeyType === 'RANGE')?.AttributeName,
      billingMode: describeResult.Table.BillingMode,
    });
    
  } catch (error) {
    console.error('❌ Error:', error.name, error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('📋 Table does not exist, creating it...');
      
      try {
        const createResult = await client.send(new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            {
              AttributeName: 'application_id',
              AttributeType: 'S'
            },
            {
              AttributeName: 'reference_id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'application_id',
              KeyType: 'HASH' // Partition key
            },
            {
              AttributeName: 'reference_id',
              KeyType: 'RANGE' // Sort key
            }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }));
        
        console.log('✅ Table created successfully:', createResult.TableDescription.TableName);
      } catch (createError) {
        console.error('❌ Failed to create table:', createError.name, createError.message);
      }
    }
  }
}

testDynamoDB().catch(console.error);
