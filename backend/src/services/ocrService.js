// Mock OCR Service for backend startup
module.exports = {
  extractText: async (imageBuffer) => {
    return { text: 'Mock OCR result', confidence: 1.0 };
  }
};
