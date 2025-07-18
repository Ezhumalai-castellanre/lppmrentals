// Mock storage for testing Netlify functions
// In production, this would be replaced with actual database connection

export const storage = {
  async getApplication(id) {
    console.log(`Mock: Getting application ${id}`);
    return {
      id,
      applicantName: 'Test User',
      applicantEmail: 'test@example.com',
      status: 'submitted',
      applicationDate: new Date().toISOString()
    };
  },

  async createApplication(insertApplication) {
    console.log('Mock: Creating application', insertApplication);
    const id = Math.floor(Math.random() * 1000) + 1;
    return {
      id,
      ...insertApplication,
      applicationDate: new Date().toISOString(),
      status: 'submitted'
    };
  },

  async updateApplication(id, updateData) {
    console.log(`Mock: Updating application ${id}`, updateData);
    return {
      id,
      ...updateData,
      applicationDate: new Date().toISOString()
    };
  },

  async getAllApplications() {
    console.log('Mock: Getting all applications');
    return [
      {
        id: 1,
        applicantName: 'Test User 1',
        applicantEmail: 'test1@example.com',
        status: 'submitted',
        applicationDate: new Date().toISOString()
      },
      {
        id: 2,
        applicantName: 'Test User 2',
        applicantEmail: 'test2@example.com',
        status: 'draft',
        applicationDate: new Date().toISOString()
      }
    ];
  }
}; 