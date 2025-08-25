declare module '../aws-exports.js' {
  const config: {
    API: {
      GraphQL: {
        endpoint: string;
        region: string;
        defaultAuthMode: string;
        apiKey: string;
      };
    };
  };
  export default config;
}


