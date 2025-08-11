// Simple storage mock for Netlify functions
// This provides a basic interface for development/testing purposes

export const storage = {
  // Mock storage methods
  async getAllApplications() {
    console.log('📁 Mock storage: getAllApplications called');
    return [];
  },

  async getApplication(id) {
    console.log(`📁 Mock storage: getApplication called with id ${id}`);
    return null;
  },

  async createApplication(data) {
    console.log('📁 Mock storage: createApplication called with data:', data);
    return {
      id: Math.floor(Math.random() * 1000),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  async updateApplication(id, data) {
    console.log(`📁 Mock storage: updateApplication called with id ${id} and data:`, data);
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString()
    };
  }
};
