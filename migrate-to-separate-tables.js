#!/usr/bin/env node

/**
 * Migration Script: Single Table to Separate Tables
 * 
 * This script migrates data from the old single "DraftSaved" table
 * to the new separate tables structure:
 * - app_nyc: Application Information
 * - applicant_nyc: Primary Applicant data
 * - Co-Applicants: Co-Applicant data
 * - Guarantors_nyc: Guarantor data
 */

const { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

// Configuration
const config = {
  region: process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1',
  accessKeyId: process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY,
  oldTable: 'DraftSaved',
  newTables: {
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

// Generate application ID
function generateApplicationId() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

// Extract application information from form data
function extractApplicationInfo(formData) {
  return {
    application_info: formData,
    current_step: formData.current_step || 0,
    status: formData.status || 'draft',
    uploaded_files_metadata: formData.uploaded_files_metadata,
    webhook_responses: formData.webhook_responses,
    signatures: formData.signatures,
    encrypted_documents: formData.encrypted_documents,
    storage_mode: formData.storage_mode,
    s3_references: formData.s3_references,
    flow_type: formData.flow_type,
    webhook_flow_version: formData.webhook_flow_version
  };
}

// Extract applicant information from form data
function extractApplicantInfo(formData) {
  // Extract primary applicant data
  const applicantData = {
    applicant_info: {
      personal_info: formData.personal_info,
      contact_info: formData.contact_info,
      employment_info: formData.employment_info,
      income_info: formData.income_info,
      // Add other applicant-specific fields
    },
    occupants: formData.occupants || [],
    webhookSummary: formData.webhook_responses?.applicant || {},
    signature: formData.signatures?.applicant || {},
    status: formData.status || 'draft'
  };

  return applicantData;
}

// Extract co-applicant information from form data
function extractCoApplicantInfo(formData) {
  const coApplicantData = {
    coapplicant_info: {
      personal_info: formData.coapplicant_personal_info,
      contact_info: formData.coapplicant_contact_info,
      employment_info: formData.coapplicant_employment_info,
      income_info: formData.coapplicant_income_info,
      // Add other co-applicant-specific fields
    },
    occupants: formData.coapplicant_occupants || [],
    webhookSummary: formData.webhook_responses?.coapplicant || {},
    signature: formData.signatures?.coapplicant || {},
    status: formData.status || 'draft'
  };

  return coApplicantData;
}

// Extract guarantor information from form data
function extractGuarantorInfo(formData) {
  const guarantorData = {
    guarantor_info: {
      personal_info: formData.guarantor_personal_info,
      contact_info: formData.guarantor_contact_info,
      employment_info: formData.guarantor_employment_info,
      income_info: formData.guarantor_income_info,
      // Add other guarantor-specific fields
    },
    occupants: formData.guarantor_occupants || [],
    webhookSummary: formData.webhook_responses?.guarantor || {},
    signature: formData.signatures?.guarantor || {},
    status: formData.status || 'draft'
  };

  return guarantorData;
}

// Migrate a single record
async function migrateRecord(record) {
  try {
    const { applicantId, zoneinfo, form_data, ...otherData } = record;
    
    console.log(`🔄 Migrating record for applicantId: ${applicantId}`);
    
    // Generate new application ID
    const appid = generateApplicationId();
    
    // 1. Create Application Data
    const applicationData = {
      appid,
      zoneinfo,
      ...extractApplicationInfo({ ...form_data, ...otherData }),
      last_updated: new Date().toISOString()
    };

    await client.send(new PutItemCommand({
      TableName: config.newTables.app_nyc,
      Item: marshall(applicationData)
    }));

    // 2. Create Applicant Data
    const applicantData = {
      userId: zoneinfo,
      zoneinfo,
      ...extractApplicantInfo({ ...form_data, ...otherData }),
      last_updated: new Date().toISOString()
    };

    await client.send(new PutItemCommand({
      TableName: config.newTables.applicant_nyc,
      Item: marshall(applicantData)
    }));

    // 3. Create Co-Applicant Data (if exists)
    if (form_data.coapplicant_personal_info || form_data.coapplicant_contact_info) {
      const coApplicantData = {
        userId: zoneinfo,
        zoneinfo,
        ...extractCoApplicantInfo({ ...form_data, ...otherData }),
        last_updated: new Date().toISOString()
      };

      await client.send(new PutItemCommand({
        TableName: config.newTables.coapplicants,
        Item: marshall(coApplicantData)
      }));
    }

    // 4. Create Guarantor Data (if exists)
    if (form_data.guarantor_personal_info || form_data.guarantor_contact_info) {
      const guarantorData = {
        userId: zoneinfo,
        zoneinfo,
        ...extractGuarantorInfo({ ...form_data, ...otherData }),
        last_updated: new Date().toISOString()
      };

      await client.send(new PutItemCommand({
        TableName: config.newTables.guarantors,
        Item: marshall(guarantorData)
      }));
    }

    console.log(`✅ Successfully migrated record for applicantId: ${applicantId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error migrating record:`, error);
    return false;
  }
}

// Scan and migrate all records from old table
async function migrateAllRecords() {
  try {
    console.log('🔍 Scanning old table for records to migrate...');
    
    let lastEvaluatedKey = undefined;
    let totalRecords = 0;
    let migratedRecords = 0;
    let failedRecords = 0;

    do {
      const scanCommand = new ScanCommand({
        TableName: config.oldTable,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 25 // Process in batches
      });

      const result = await client.send(scanCommand);
      const records = result.Items || [];
      
      console.log(`📦 Processing batch of ${records.length} records...`);
      
      for (const record of records) {
        totalRecords++;
        const unmarshalledRecord = unmarshall(record);
        const success = await migrateRecord(unmarshalledRecord);
        
        if (success) {
          migratedRecords++;
        } else {
          failedRecords++;
        }
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
      
      // Add delay between batches to avoid throttling
      if (lastEvaluatedKey) {
        console.log('⏳ Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } while (lastEvaluatedKey);

    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`Total records processed: ${totalRecords}`);
    console.log(`Successfully migrated: ${migratedRecords}`);
    console.log(`Failed migrations: ${failedRecords}`);
    
    if (failedRecords === 0) {
      console.log('\n🎉 Migration completed successfully!');
      return true;
    } else {
      console.log('\n⚠️ Migration completed with some failures. Please review the errors above.');
      return false;
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    return false;
  }
}

// Verify migration by checking record counts
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Count records in old table
    const oldTableScan = new ScanCommand({
      TableName: config.oldTable,
      Select: 'COUNT'
    });
    const oldTableResult = await client.send(oldTableScan);
    const oldTableCount = oldTableResult.Count || 0;
    
    // Count records in new tables
    const newTableCounts = {};
    for (const [key, tableName] of Object.entries(config.newTables)) {
      const scanCommand = new ScanCommand({
        TableName: tableName,
        Select: 'COUNT'
      });
      const result = await client.send(scanCommand);
      newTableCounts[key] = result.Count || 0;
    }
    
    console.log('📊 Record Counts:');
    console.log(`Old table (${config.oldTable}): ${oldTableCount}`);
    Object.entries(newTableCounts).forEach(([key, count]) => {
      console.log(`New table (${config.newTables[key]}): ${count}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    return false;
  }
}

// Main migration function
async function main() {
  try {
    console.log('🚀 Starting Migration: Single Table to Separate Tables');
    console.log('====================================================\n');
    
    // Validate configuration
    if (!config.accessKeyId || !config.secretAccessKey) {
      console.error('❌ AWS credentials not found in environment variables');
      console.log('Please set the following environment variables:');
      console.log('- VITE_AWS_DYNAMODB_ACCESS_KEY_ID');
      console.log('- VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY');
      console.log('- VITE_AWS_DYNAMODB_REGION (optional, defaults to us-east-1)');
      process.exit(1);
    }
    
    // Run migration
    const migrationSuccess = await migrateAllRecords();
    
    if (migrationSuccess) {
      // Verify migration
      await verifyMigration();
      
      console.log('\n✅ Migration process completed!');
      console.log('\nNext steps:');
      console.log('1. Test the new separate tables structure');
      console.log('2. Update your application code to use the new service');
      console.log('3. Once verified, you can safely delete the old table');
    } else {
      console.log('\n❌ Migration failed. Please review the errors and try again.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateAllRecords, verifyMigration, migrateRecord };
