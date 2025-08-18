// Mock Document Processing Service for backend startup
module.exports = {
  processDocument: async (docBuffer) => {
    return { text: 'Mock document processing result', confidence: 1.0 };
  }
};
