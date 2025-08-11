// AWS AppSync GraphQL configuration
const graphqlConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql',
      region: 'us-west-2',
      defaultAuthMode: 'apiKey',
      apiKey: 'da2-iboh2su4pzavnnsf3h3mwhy3qm'
    }
  }
};

// Don't configure Amplify here - it's already configured in aws-config.ts
// This prevents conflicts with the existing Cognito configuration

export default graphqlConfig;
