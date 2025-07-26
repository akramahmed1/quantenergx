const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ocrService = require('../services/ocrService');
const documentProcessingService = require('../services/documentProcessingService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and some document formats
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp',
      'application/pdf',
      'image/gif',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  },
});

// Rate limiting for OCR requests
const ocrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 OCR requests per windowMs
  message: {
    error: 'Too many OCR requests from this IP, please try again later.',
  },
});

// OCR Status endpoint
router.get('/status', (req, res) => {
  res.json({
    service: 'OCR Service',
    status: 'online',
    supported_languages: ['eng', 'ara', 'fas', 'chi_sim', 'rus', 'fra', 'spa', 'urd'],
    supported_formats: ['jpeg', 'png', 'tiff', 'bmp', 'webp', 'pdf'],
    max_file_size: '50MB',
    max_files_per_request: 10,
  });
});

// Process single document with OCR
router.post(
  '/process',
  ocrRateLimit,
  authenticateToken,
  upload.single('document'),
  [
    body('language')
      .optional()
      .isIn(['eng', 'ara', 'fas', 'chi_sim', 'rus', 'fra', 'spa', 'urd'])
      .withMessage('Invalid language. Supported: eng, ara, fas, chi_sim, rus, fra, spa, urd'),
    body('extractFields').optional().isBoolean().withMessage('extractFields must be a boolean'),
    body('detectStamps').optional().isBoolean().withMessage('detectStamps must be a boolean'),
    body('detectSignatures')
      .optional()
      .isBoolean()
      .withMessage('detectSignatures must be a boolean'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No document file provided' });
      }

      const options = {
        language: req.body.language || 'eng',
        extractFields: req.body.extractFields === 'true',
        detectStamps: req.body.detectStamps === 'true',
        detectSignatures: req.body.detectSignatures === 'true',
      };

      const result = await ocrService.processDocument(req.file, options);

      res.json({
        success: true,
        document_id: result.documentId,
        extracted_text: result.text,
        confidence: result.confidence,
        language_detected: result.detectedLanguage,
        fields_extracted: result.fields || null,
        stamps_detected: result.stamps || null,
        signatures_detected: result.signatures || null,
        processing_time_ms: result.processingTime,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({
        error: 'OCR processing failed',
        message: error.message,
      });
    }
  }
);

// Process multiple documents (batch)
router.post(
  '/batch',
  ocrRateLimit,
  authenticateToken,
  upload.array('documents', 10),
  [
    body('language').optional().isIn(['eng', 'ara', 'fas', 'chi_sim', 'rus', 'fra', 'spa', 'urd']),
    body('extractFields').optional().isBoolean(),
    body('detectStamps').optional().isBoolean(),
    body('detectSignatures').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No document files provided' });
      }

      const options = {
        language: req.body.language || 'eng',
        extractFields: req.body.extractFields === 'true',
        detectStamps: req.body.detectStamps === 'true',
        detectSignatures: req.body.detectSignatures === 'true',
      };

      const batchId = await ocrService.processBatch(req.files, options);

      res.json({
        success: true,
        batch_id: batchId,
        total_documents: req.files.length,
        status: 'processing',
        message: 'Batch processing started. Use GET /ocr/batch/:batchId to check status.',
      });
    } catch (error) {
      console.error('Batch OCR processing error:', error);
      res.status(500).json({
        error: 'Batch OCR processing failed',
        message: error.message,
      });
    }
  }
);

// Get batch processing status
router.get('/batch/:batchId', authenticateToken, async (req, res) => {
  try {
    const batchStatus = await ocrService.getBatchStatus(req.params.batchId);
    res.json(batchStatus);
  } catch (error) {
    console.error('Batch status error:', error);
    res.status(500).json({
      error: 'Failed to retrieve batch status',
      message: error.message,
    });
  }
});

// Get document processing history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const language = req.query.language;

    const history = await ocrService.getProcessingHistory(page, limit, language);
    res.json(history);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve processing history',
      message: error.message,
    });
  }
});

// Document field extraction with manual review
router.post(
  '/extract-fields/:documentId',
  authenticateToken,
  [
    body('fieldDefinitions').isArray().withMessage('fieldDefinitions must be an array'),
    body('fieldDefinitions.*.name').notEmpty().withMessage('Field name is required'),
    body('fieldDefinitions.*.type')
      .isIn(['text', 'number', 'date', 'currency'])
      .withMessage('Invalid field type'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await documentProcessingService.extractFields(
        req.params.documentId,
        req.body.fieldDefinitions
      );

      res.json(result);
    } catch (error) {
      console.error('Field extraction error:', error);
      res.status(500).json({
        error: 'Field extraction failed',
        message: error.message,
      });
    }
  }
);

// Submit manual review corrections
router.post(
  '/review/:documentId',
  authenticateToken,
  [
    body('corrections').isObject().withMessage('corrections must be an object'),
    body('reviewStatus')
      .isIn(['approved', 'rejected', 'needs_revision'])
      .withMessage('Invalid review status'),
    body('comments').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await documentProcessingService.submitReview(
        req.params.documentId,
        req.body.corrections,
        req.body.reviewStatus,
        req.body.comments,
        req.user.id
      );

      res.json(result);
    } catch (error) {
      console.error('Review submission error:', error);
      res.status(500).json({
        error: 'Review submission failed',
        message: error.message,
      });
    }
  }
);

module.exports = router;
