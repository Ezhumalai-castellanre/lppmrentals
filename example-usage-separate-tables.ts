/**
 * Example Usage: Separate Tables DynamoDB Service
 * 
 * This file demonstrates how to use the new separate tables structure
 * for storing and retrieving application data.
 */

import { dynamoDBSeparateTablesUtils } from './client/src/lib/dynamodb-separate-tables-service';

// Example: Complete application data flow
async function exampleApplicationFlow() {
  console.log('🚀 Example: Complete Application Data Flow');
  console.log('==========================================');

  try {
    // 1. Save Application Information
    console.log('\n1. Saving Application Information...');
    const applicationData = {
      application_info: {
        property_address: '123 Main St, New York, NY 10001',
        unit_number: 'Apt 4B',
        lease_start_date: '2024-02-01',
        lease_duration: 12,
        monthly_rent: 2500,
        security_deposit: 5000,
        application_fee: 100
      },
      current_step: 1,
      status: 'draft' as const,
      uploaded_files_metadata: {
        documents: ['lease_agreement.pdf', 'property_photos.zip']
      },
      webhook_responses: {
        property_verification: { status: 'pending', timestamp: new Date().toISOString() }
      },
      storage_mode: 'hybrid' as const,
      s3_references: ['s3://bucket/lease_agreement.pdf']
    };

    const appSaved = await dynamoDBSeparateTablesUtils.saveApplicationData(applicationData);
    console.log('✅ Application data saved:', appSaved);

    // 2. Save Primary Applicant Data
    console.log('\n2. Saving Primary Applicant Data...');
    const applicantData = {
      applicant_info: {
        personal_info: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-15',
          ssn: '***-**-1234',
          email: 'john.doe@email.com',
          phone: '(555) 123-4567'
        },
        contact_info: {
          current_address: '456 Oak Ave, Brooklyn, NY 11201',
          previous_address: '789 Pine St, Queens, NY 11375',
          emergency_contact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '(555) 987-6543'
          }
        },
        employment_info: {
          employer: 'Tech Corp Inc',
          position: 'Software Engineer',
          employment_type: 'Full-time',
          start_date: '2020-03-01',
          monthly_income: 8000,
          supervisor_name: 'Bob Smith',
          supervisor_phone: '(555) 456-7890'
        },
        income_info: {
          primary_income: 8000,
          other_income: 500,
          total_monthly_income: 8500,
          bank_accounts: [
            {
              bank_name: 'Chase Bank',
              account_type: 'Checking',
              balance: 15000
            }
          ]
        }
      },
      occupants: [
        {
          name: 'John Doe',
          relationship: 'Primary Applicant',
          age: 34,
          occupation: 'Software Engineer'
        },
        {
          name: 'Jane Doe',
          relationship: 'Spouse',
          age: 32,
          occupation: 'Teacher'
        }
      ],
      webhookSummary: {
        credit_check: { status: 'approved', score: 750 },
        employment_verification: { status: 'verified', date: new Date().toISOString() },
        income_verification: { status: 'verified', amount: 8500 }
      },
      signature: {
        applicant_signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        signature_date: new Date().toISOString(),
        ip_address: '192.168.1.100'
      },
      status: 'draft' as const
    };

    const applicantSaved = await dynamoDBSeparateTablesUtils.saveApplicantData(applicantData);
    console.log('✅ Applicant data saved:', applicantSaved);

    // 3. Save Co-Applicant Data (if exists)
    console.log('\n3. Saving Co-Applicant Data...');
    const coApplicantData = {
      coapplicant_info: {
        personal_info: {
          first_name: 'Jane',
          last_name: 'Doe',
          date_of_birth: '1992-05-20',
          ssn: '***-**-5678',
          email: 'jane.doe@email.com',
          phone: '(555) 123-4568'
        },
        contact_info: {
          current_address: '456 Oak Ave, Brooklyn, NY 11201',
          previous_address: '321 Elm St, Manhattan, NY 10002'
        },
        employment_info: {
          employer: 'Education First',
          position: 'Elementary Teacher',
          employment_type: 'Full-time',
          start_date: '2018-09-01',
          monthly_income: 4500
        },
        income_info: {
          primary_income: 4500,
          other_income: 0,
          total_monthly_income: 4500
        }
      },
      occupants: [
        {
          name: 'Jane Doe',
          relationship: 'Co-Applicant',
          age: 32,
          occupation: 'Teacher'
        }
      ],
      webhookSummary: {
        credit_check: { status: 'approved', score: 720 },
        employment_verification: { status: 'verified', date: new Date().toISOString() }
      },
      signature: {
        coapplicant_signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        signature_date: new Date().toISOString(),
        ip_address: '192.168.1.100'
      },
      status: 'draft' as const
    };

    const coApplicantSaved = await dynamoDBSeparateTablesUtils.saveCoApplicantData(coApplicantData);
    console.log('✅ Co-applicant data saved:', coApplicantSaved);

    // 4. Save Guarantor Data (if exists)
    console.log('\n4. Saving Guarantor Data...');
    const guarantorData = {
      guarantor_info: {
        personal_info: {
          first_name: 'Robert',
          last_name: 'Smith',
          date_of_birth: '1965-08-10',
          ssn: '***-**-9012',
          email: 'robert.smith@email.com',
          phone: '(555) 234-5678'
        },
        contact_info: {
          current_address: '789 Maple Dr, Staten Island, NY 10301',
          relationship_to_applicant: 'Father'
        },
        employment_info: {
          employer: 'Smith & Associates',
          position: 'Business Owner',
          employment_type: 'Self-employed',
          monthly_income: 12000
        },
        income_info: {
          primary_income: 12000,
          other_income: 2000,
          total_monthly_income: 14000
        }
      },
      occupants: [
        {
          name: 'Robert Smith',
          relationship: 'Guarantor',
          age: 59,
          occupation: 'Business Owner'
        }
      ],
      webhookSummary: {
        credit_check: { status: 'approved', score: 780 },
        income_verification: { status: 'verified', amount: 14000 }
      },
      signature: {
        guarantor_signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        signature_date: new Date().toISOString(),
        ip_address: '192.168.1.101'
      },
      status: 'draft' as const
    };

    const guarantorSaved = await dynamoDBSeparateTablesUtils.saveGuarantorData(guarantorData);
    console.log('✅ Guarantor data saved:', guarantorSaved);

    // 5. Retrieve All Data
    console.log('\n5. Retrieving All Data...');
    const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
    console.log('📊 Retrieved data summary:');
    console.log('  - Application data:', allData.application ? '✅ Found' : '❌ Not found');
    console.log('  - Applicant data:', allData.applicant ? '✅ Found' : '❌ Not found');
    console.log('  - Co-applicant data:', allData.coApplicant ? '✅ Found' : '❌ Not found');
    console.log('  - Guarantor data:', allData.guarantor ? '✅ Found' : '❌ Not found');

    console.log('\n🎉 Example completed successfully!');

  } catch (error) {
    console.error('❌ Error in example:', error);
  }
}

// Example: Individual table operations
async function exampleIndividualOperations() {
  console.log('\n🔧 Example: Individual Table Operations');
  console.log('=====================================');

  try {
    // Get only applicant data
    console.log('\n1. Getting Applicant Data...');
    const applicantData = await dynamoDBSeparateTablesUtils.getApplicantData();
    if (applicantData) {
      console.log('✅ Applicant found:', applicantData.applicant_info.personal_info.first_name);
    } else {
      console.log('❌ No applicant data found');
    }

    // Get only co-applicant data
    console.log('\n2. Getting Co-Applicant Data...');
    const coApplicantData = await dynamoDBSeparateTablesUtils.getCoApplicantData();
    if (coApplicantData) {
      console.log('✅ Co-applicant found:', coApplicantData.coapplicant_info.personal_info.first_name);
    } else {
      console.log('❌ No co-applicant data found');
    }

    // Get only guarantor data
    console.log('\n3. Getting Guarantor Data...');
    const guarantorData = await dynamoDBSeparateTablesUtils.getGuarantorData();
    if (guarantorData) {
      console.log('✅ Guarantor found:', guarantorData.guarantor_info.personal_info.first_name);
    } else {
      console.log('❌ No guarantor data found');
    }

  } catch (error) {
    console.error('❌ Error in individual operations:', error);
  }
}

// Example: Data cleanup
async function exampleDataCleanup() {
  console.log('\n🧹 Example: Data Cleanup');
  console.log('======================');

  try {
    // Delete all user data
    console.log('\n1. Deleting All User Data...');
    const deleted = await dynamoDBSeparateTablesUtils.deleteAllUserData();
    if (deleted) {
      console.log('✅ All user data deleted successfully');
    } else {
      console.log('❌ Failed to delete user data');
    }

  } catch (error) {
    console.error('❌ Error in data cleanup:', error);
  }
}

// Run examples
async function runExamples() {
  console.log('📚 Separate Tables DynamoDB Service Examples');
  console.log('===========================================');
  
  await exampleApplicationFlow();
  await exampleIndividualOperations();
  await exampleDataCleanup();
  
  console.log('\n✨ All examples completed!');
}

// Export for use in other files
export {
  exampleApplicationFlow,
  exampleIndividualOperations,
  exampleDataCleanup,
  runExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
