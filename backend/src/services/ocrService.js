const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const Bull = require('bull');
const redis = require('redis');

class OCRService {
  constructor() {
    // Initialize Redis connection for caching and queues
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });

    // Initialize Bull queue for batch processing
    this.ocrQueue = new Bull('OCR processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    // Configure OCR workers
    this.setupWorkers();
  }

  setupWorkers() {
    // Process OCR jobs
    this.ocrQueue.process('ocr-document', async (job) => {
      const { filePath, options, documentId } = job.data;
      return await this._performOCR(filePath, options, documentId);
    });

    // Process batch jobs
    this.ocrQueue.process('ocr-batch', async (job) => {
      const { files, options, batchId } = job.data;
      return await this._processBatchJob(files, options, batchId);
    });
  }

  async processDocument(file, options = {}) {
    const startTime = Date.now();
    const documentId = uuidv4();
    
    try {
      // Validate and preprocess the file
      const processedFilePath = await this._preprocessFile(file);
      
      // Perform OCR
      const result = await this._performOCR(processedFilePath, options, documentId);
      
      // Store result in database (placeholder for now)
      await this._storeResult(documentId, result, file.originalname);
      
      // Clean up temporary files
      await this._cleanup([processedFilePath, file.path]);
      
      return {
        documentId,
        text: result.text,
        confidence: result.confidence,
        detectedLanguage: result.detectedLanguage,
        fields: result.fields,
        stamps: result.stamps,
        signatures: result.signatures,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async processBatch(files, options = {}) {
    const batchId = uuidv4();
    
    try {
      // Add batch job to queue
      await this.ocrQueue.add('ocr-batch', {
        files: files.map(file => ({
          path: file.path,
          originalname: file.originalname,
          mimetype: file.mimetype
        })),
        options,
        batchId
      });

      // Store batch metadata
      await this._storeBatchMetadata(batchId, files.length);
      
      return batchId;

    } catch (error) {
      console.error('Batch processing error:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }

  async getBatchStatus(batchId) {
    try {
      const jobs = await this.ocrQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const batchJobs = jobs.filter(job => job.data.batchId === batchId);
      
      const status = {
        batch_id: batchId,
        total_documents: batchJobs.length,
        completed: batchJobs.filter(job => job.finishedOn).length,
        failed: batchJobs.filter(job => job.failedReason).length,
        processing: batchJobs.filter(job => job.processedOn && !job.finishedOn).length,
        waiting: batchJobs.filter(job => !job.processedOn).length,
        results: []
      };

      // Get completed results
      for (const job of batchJobs.filter(job => job.finishedOn)) {
        if (job.returnvalue) {
          status.results.push({
            document_id: job.returnvalue.documentId,
            filename: job.data.filename,
            status: 'completed',
            confidence: job.returnvalue.confidence,
            text_length: job.returnvalue.text ? job.returnvalue.text.length : 0
          });
        }
      }

      return status;

    } catch (error) {
      console.error('Batch status error:', error);
      throw new Error(`Failed to get batch status: ${error.message}`);
    }
  }

  async getProcessingHistory(page = 1, limit = 20) {
    // This would typically query a database
    // For now, return a placeholder structure
    return {
      page,
      limit,
      total: 0,
      documents: [],
      message: 'Database integration pending'
    };
  }

  async _preprocessFile(file) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    try {
      if (fileExtension === '.pdf') {
        return await this._convertPdfToImage(file.path);
      } else if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp'].includes(fileExtension)) {
        return await this._preprocessImage(file.path);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`File preprocessing failed: ${error.message}`);
    }
  }

  async _convertPdfToImage(pdfPath) {
    try {
      // First, try to extract text directly from PDF
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      if (pdfData.text && pdfData.text.length > 50) {
        // PDF has extractable text, create a text file for processing
        const textPath = pdfPath.replace('.pdf', '_extracted.txt');
        await fs.writeFile(textPath, pdfData.text);
        return textPath;
      }
      
      // PDF is image-based, would need PDF to image conversion
      // For now, throw an error as we'd need additional dependencies
      throw new Error('Image-based PDF processing requires additional dependencies (pdf2pic)');
      
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  async _preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.[^.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(2000, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .sharpen()
        .normalize()
        .png({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  async _performOCR(filePath, options) {
    const { language = 'eng', extractFields = false, detectStamps = false, detectSignatures = false } = options;
    
    try {
      // Handle text files (from PDF extraction)
      if (filePath.endsWith('_extracted.txt')) {
        const text = await fs.readFile(filePath, 'utf8');
        return {
          text,
          confidence: 100, // High confidence for extracted text
          detectedLanguage: language,
          fields: extractFields ? await this._extractFields(text) : null,
          stamps: detectStamps ? await this._detectStamps(text) : null,
          signatures: detectSignatures ? await this._detectSignatures(text) : null
        };
      }

      // Perform OCR on images
      const result = await Tesseract.recognize(
        filePath,
        language,
        {
          logger: m => console.log(m)
        }
      );

      const extractedText = result.data.text;
      const confidence = result.data.confidence;

      return {
        text: extractedText,
        confidence,
        detectedLanguage: language,
        fields: extractFields ? await this._extractFields(extractedText) : null,
        stamps: detectStamps ? await this._detectStamps(extractedText) : null,
        signatures: detectSignatures ? await this._detectSignatures(extractedText) : null
      };

    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async _extractFields(text) {
    // Simple field extraction using regex patterns
    // In production, this would use ML models
    const fields = {};
    
    // Extract common trading document fields
 const patterns = {
  contractNumber: /contract\s*#?\s*:?\s*([A-Z0-9-]+)/i,
  tradeDate: /trade\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  volume: /volume\s*:?\s*([\d,]+\.?\d*)\s*(barrels?|bbl|tons?|mt)/i,
  price: /price\s*:?\s*\$?([\d,]+\.?\d*)/i,
  commodity: /(crude\s*oil|natural\s*gas|lng|gasoline|diesel|fuel\s*oil)/i,
  counterparty: /counterparty\s*:?\s*([A-Z][A-Za-z\s&,.]+)/i
};

for (const [fieldName, pattern] of Object.entries(patterns)) {
  const match = text.match(pattern);
  if (match) {
    fields[fieldName] = match[1];
  }
}

return Object.keys(fields).length > 0 ? fields : null;
}

async _detectStamps(text) {
  // Simple stamp detection based on text patterns
  const stampPatterns = [
    /APPROVED/i,
    /RECEIVED/i,
    /CONFIDENTIAL/i,
    /URGENT/i,
    /COPY/i,
    /ORIGINAL/i,
    /FILED/i
  ];

  const detectedStamps = [];
  for (const pattern of stampPatterns) {
    if (pattern.test(text)) {
      detectedStamps.push(pattern.source.replace(/[/\\i]/g, ''));
    }
  }

    return detectedStamps.length > 0 ? detectedStamps : null;
  }

  async _detectSignatures(text) {
    // Simple signature detection based on text patterns
    const signaturePatterns = [
      /signature\s*:?\s*([A-Z][A-Za-z\s]+)/i,
      /signed\s*by\s*:?\s*([A-Z][A-Za-z\s]+)/i,
      /authorized\s*by\s*:?\s*([A-Z][A-Za-z\s]+)/i
    ];

    const detectedSignatures = [];
    for (const pattern of signaturePatterns) {
      const match = text.match(pattern);
      if (match) {
        detectedSignatures.push(match[1]);
      }
    }

    return detectedSignatures.length > 0 ? detectedSignatures : null;
  }

  async _processBatchJob(files, options, batchId) {
    const results = [];
    
    for (const file of files) {
      try {
        const documentId = uuidv4();
        const result = await this._performOCR(file.path, options, documentId);
        
        results.push({
          documentId,
          filename: file.originalname,
          status: 'completed',
          ...result
        });
        
        // Store individual result
        await this._storeResult(documentId, result, file.originalname);
        
      } catch (error) {
        results.push({
          filename: file.originalname,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return { batchId, results };
  }

  async _storeResult(documentId, result, filename) {
    // Store result in Redis for now (in production, use PostgreSQL)
    try {
      const resultData = {
        documentId,
        filename,
        ...result,
        timestamp: new Date().toISOString()
      };
      
      await this.redisClient.setex(
        `ocr:result:${documentId}`,
        3600 * 24, // 24 hours
        JSON.stringify(resultData)
      );
      
    } catch (error) {
      console.error('Failed to store OCR result:', error);
    }
  }

  async _storeBatchMetadata(batchId, totalDocuments) {
    try {
      const metadata = {
        batchId,
        totalDocuments,
        createdAt: new Date().toISOString(),
        status: 'processing'
      };
      
      await this.redisClient.setex(
        `ocr:batch:${batchId}`,
        3600 * 24, // 24 hours
        JSON.stringify(metadata)
      );
      
    } catch (error) {
      console.error('Failed to store batch metadata:', error);
    }
  }

  async _cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }
    }
  }
}

module.exports = new OCRService();
