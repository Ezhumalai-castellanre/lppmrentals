// Test GraphQL connection to AWS AppSync
export async function testGraphQLConnection() {
  console.log('🧪 Testing GraphQL connection to AWS AppSync...');
  
  try {
    const response = await fetch('https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'da2-iboh2su4pzavnnsf3h3mwhy3qm',
      },
      body: JSON.stringify({
        query: `
          query TestConnection {
            listDraftSaveds(limit: 1) {
              items {
                applicantId
              }
              nextToken
            }
          }
        `
      })
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }
    
    console.log('✅ GraphQL connection successful!');
    console.log('📊 Response:', data);
    return { success: true, response: data };
    
  } catch (error) {
    console.error('❌ GraphQL connection failed:', error);
    return { success: false, error };
  }
}

// Introspect the GraphQL schema to see what's available
export async function introspectSchema() {
  console.log('🔍 Introspecting GraphQL schema...');
  
  try {
    const response = await fetch('https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'da2-iboh2su4pzavnnsf3h3mwhy3qm',
      },
      body: JSON.stringify({
        query: `
          query IntrospectSchema {
            __schema {
              queryType {
                name
                fields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                  args {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
              }
              mutationType {
                name
                fields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                  args {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
              }
              subscriptionType {
                name
                fields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                  args {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
              }
              types {
                name
                kind
                description
                fields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                      ofType {
                        name
                        kind
                      }
                    }
                  }
                  args {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
                inputFields {
                  name
                  description
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
                enumValues {
                  name
                  description
                }
              }
            }
          }
        `
      })
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL introspection failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      console.warn('⚠️ Schema introspection had errors:', data.errors);
    }
    
    console.log('🔍 Schema introspection result:', data);
    return { success: true, schema: data };
    
  } catch (error) {
    console.error('❌ Schema introspection failed:', error);
    return { success: false, error };
  }
}

// Get a simplified, readable version of the schema
export async function getReadableSchema() {
  console.log('📖 Getting readable schema summary...');
  
  try {
    const result = await introspectSchema();
    
    if (!result.success) {
      throw new Error('Failed to introspect schema');
    }
    
    const schema = result.schema.data.__schema;
    
    // Extract key information
    const queries = schema.queryType?.fields || [];
    const mutations = schema.mutationType?.fields || [];
    const subscriptions = schema.subscriptionType?.fields || [];
    const types = schema.types || [];
    
    // Find the main data types (excluding built-in GraphQL types)
    const dataTypes = types.filter(type => 
      type.kind === 'OBJECT' && 
      !type.name.startsWith('__') &&
      type.name !== 'Query' &&
      type.name !== 'Mutation' &&
      type.name !== 'Subscription'
    );
    
    // Find input types
    const inputTypes = types.filter(type => 
      type.kind === 'INPUT_OBJECT' && 
      !type.name.startsWith('__')
    );
    
    // Find enum types
    const enumTypes = types.filter(type => 
      type.kind === 'ENUM' && 
      !type.name.startsWith('__')
    );
    
    const readableSchema = {
      queries: queries.map(q => ({
        name: q.name,
        description: q.description,
        returnType: q.type.name || q.type.ofType?.name || 'Unknown',
        args: q.args.map(arg => ({
          name: arg.name,
          type: arg.type.name || 'Unknown'
        }))
      })),
      mutations: mutations.map(m => ({
        name: m.name,
        description: m.description,
        returnType: m.type.name || m.type.ofType?.name || 'Unknown',
        args: m.args.map(arg => ({
          name: arg.name,
          type: arg.type.name || 'Unknown'
        }))
      })),
      subscriptions: subscriptions.map(s => ({
        name: s.name,
        description: s.description,
        returnType: s.type.name || s.type.ofType?.name || 'Unknown',
        args: s.args.map(arg => ({
          name: arg.name,
          type: arg.type.name || 'Unknown'
        }))
      })),
      dataTypes: dataTypes.map(t => ({
        name: t.name,
        description: t.description,
        fields: t.fields?.map(f => ({
          name: f.name,
          description: f.description,
          type: f.type.name || f.type.ofType?.name || 'Unknown'
        })) || []
      })),
      inputTypes: inputTypes.map(t => ({
        name: t.name,
        description: t.description,
        fields: t.inputFields?.map(f => ({
          name: f.name,
          description: f.description,
          type: f.type.name || f.type.ofType?.name || 'Unknown'
        })) || []
      })),
      enumTypes: enumTypes.map(t => ({
        name: t.name,
        description: t.description,
        values: t.enumValues?.map(v => ({
          name: v.name,
          description: v.description
        })) || []
      }))
    };
    
    console.log('📖 Readable Schema Summary:');
    console.log('='.repeat(50));
    
    if (readableSchema.queries.length > 0) {
      console.log('🔍 QUERIES:');
      readableSchema.queries.forEach(q => {
        console.log(`  ${q.name} -> ${q.returnType}`);
        if (q.args.length > 0) {
          console.log(`    Args: ${q.args.map(a => `${a.name}: ${a.type}`).join(', ')}`);
        }
      });
      console.log('');
    }
    
    if (readableSchema.mutations.length > 0) {
      console.log('✏️ MUTATIONS:');
      readableSchema.mutations.forEach(m => {
        console.log(`  ${m.name} -> ${m.returnType}`);
        if (m.args.length > 0) {
          console.log(`    Args: ${m.args.map(a => `${a.name}: ${a.type}`).join(', ')}`);
        }
      });
      console.log('');
    }
    
    if (readableSchema.subscriptions.length > 0) {
      console.log('📡 SUBSCRIPTIONS:');
      readableSchema.subscriptions.forEach(s => {
        console.log(`  ${s.name} -> ${s.returnType}`);
        if (s.args.length > 0) {
          console.log(`    Args: ${s.args.map(a => `${a.name}: ${a.type}`).join(', ')}`);
        }
      });
      console.log('');
    }
    
    if (readableSchema.dataTypes.length > 0) {
      console.log('🏗️ DATA TYPES:');
      readableSchema.dataTypes.forEach(t => {
        console.log(`  ${t.name}:`);
        t.fields.forEach(f => {
          console.log(`    ${f.name}: ${f.type}`);
        });
      });
      console.log('');
    }
    
    if (readableSchema.inputTypes.length > 0) {
      console.log('📥 INPUT TYPES:');
      readableSchema.inputTypes.forEach(t => {
        console.log(`  ${t.name}:`);
        t.fields.forEach(f => {
          console.log(`    ${f.name}: ${f.type}`);
        });
      });
      console.log('');
    }
    
    if (readableSchema.enumTypes.length > 0) {
      console.log('🔢 ENUM TYPES:');
      readableSchema.enumTypes.forEach(t => {
        console.log(`  ${t.name}: ${t.values.map(v => v.name).join(', ')}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(50));
    
    return { success: true, readableSchema, fullSchema: result.schema };
    
  } catch (error) {
    console.error('❌ Failed to get readable schema:', error);
    return { success: false, error };
  }
}

// Test draft creation
export async function testDraftCreation() {
  console.log('🧪 Testing draft creation...');
  
  try {
    const testApplicantId = `test_${Date.now()}`;
    
    const response = await fetch('https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'da2-iboh2su4pzavnnsf3h3mwhy3qm',
      },
      body: JSON.stringify({
        query: `
          mutation CreateTestDraft($input: CreateDraftSavedInput!) {
            createDraftSaved(input: $input) {
              applicantId
            }
          }
        `,
        variables: {
          input: {
            applicantId: testApplicantId
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }
    
    console.log('✅ Draft creation successful!');
    console.log('📊 Response:', data);
    
    // Clean up - delete the test draft
    try {
      const deleteResponse = await fetch('https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'da2-iboh2su4pzavnnsf3h3mwhy3qm',
        },
        body: JSON.stringify({
          query: `
            mutation DeleteTestDraft($input: DeleteDraftSavedInput!) {
              deleteDraftSaved(input: $input) {
                applicantId
              }
            }
          `,
          variables: {
            input: {
              applicantId: testApplicantId
            }
          }
        })
      });
      
      if (deleteResponse.ok) {
        console.log('🧹 Test draft cleaned up');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to cleanup test draft:', cleanupError);
    }
    
    return { success: true, response: data };
    
  } catch (error) {
    console.error('❌ Draft creation failed:', error);
    return { success: false, error };
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Running all GraphQL tests...');
  
  const connectionTest = await testGraphQLConnection();
  const schemaTest = await introspectSchema();
  const readableSchemaTest = await getReadableSchema();
  const draftTest = await testDraftCreation();
  
  const results = {
    connection: connectionTest,
    schema: schemaTest,
    readableSchema: readableSchemaTest,
    draft: draftTest,
    allPassed: connectionTest.success && schemaTest.success && readableSchemaTest.success && draftTest.success
  };
  
  console.log('📋 Test Results:', results);
  
  if (results.allPassed) {
    console.log('🎉 All tests passed! GraphQL integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
  
  return results;
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).testGraphQL = {
    testConnection: testGraphQLConnection,
    introspectSchema: introspectSchema,
    getReadableSchema: getReadableSchema,
    testDraftCreation: testDraftCreation,
    runAllTests: runAllTests
  };
  
  console.log('🧪 GraphQL test functions added to window.testGraphQL');
  console.log('💡 Run window.testGraphQL.getReadableSchema() to see full schema summary');
  console.log('💡 Run window.testGraphQL.introspectSchema() to see raw schema data');
  console.log('💡 Run window.testGraphQL.runAllTests() to test everything');
}
