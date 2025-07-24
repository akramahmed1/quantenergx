const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const ocrService = require('../services/ocrService');
const documentProcessingService = require('../services/documentProcessingService');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/ocr.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const ocrProto = grpc.loadPackageDefinition(packageDefinition).quantenergx.ocr;

class OCRGRPCService {
  constructor() {
    this.server = new grpc.Server();
    this.setupServiceHandlers();
  }

  setupServiceHandlers() {
    this.server.addService(ocrProto.OCRService.service, {
      ProcessDocument: this.processDocument.bind(this),
      ProcessBatch: this.processBatch.bind(this),
      GetBatchStatus: this.getBatchStatus.bind(this),
      ExtractFields: this.extractFields.bind(this),
      SubmitReview: this.submitReview.bind(this),
    });
  }

  async processDocument(call, callback) {
    try {
      const { document_data, filename, mime_type, options } = call.request;
      
      // Create a temporary file object similar to multer
      const file = {
        buffer: document_data,
        originalname: filename,
        mimetype: mime_type,
        path: `/tmp/${filename}_${Date.now()}` // Temporary path
      };

      // Write buffer to temporary file
      const fs = require('fs');
      await fs.promises.writeFile(file.path, document_data);

      const ocrOptions = {
        language: options?.language || 'eng',
        extractFields: options?.extract_fields || false,
        detectStamps: options?.detect_stamps || false,
        detectSignatures: options?.detect_signatures || false,
      };

      const result = await ocrService.processDocument(file, ocrOptions);

      // Convert fields to proto format
      const fieldsMap = {};
      if (result.fields) {
        Object.entries(result.fields).forEach(([key, field]) => {
          fieldsMap[key] = {
            name: field.name || key,
            value: field.value?.toString() || '',
            type: this.mapFieldType(field.type),
            confidence: field.confidence || 0,
            needs_review: field.needs_review || false,
          };
        });
      }

      const response = {
        document_id: result.documentId,
        extracted_text: result.text || '',
        confidence: result.confidence || 0,
        detected_language: result.detectedLanguage || 'unknown',
        fields: fieldsMap,
        stamps_detected: result.stamps || [],
        signatures_detected: result.signatures || [],
        processing_time_ms: result.processingTime || 0,
        status: 'success',
        error_message: '',
      };

      callback(null, response);

      // Cleanup temporary file
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        console.error('Failed to cleanup temporary file:', error);
      }

    } catch (error) {
      console.error('gRPC ProcessDocument error:', error);
      callback(null, {
        document_id: '',
        extracted_text: '',
        confidence: 0,
        detected_language: '',
        fields: {},
        stamps_detected: [],
        signatures_detected: [],
        processing_time_ms: 0,
        status: 'error',
        error_message: error.message,
      });
    }
  }

  async processBatch(call, callback) {
    try {
      const { documents, options } = call.request;
      
      // Convert documents to file objects
      const files = documents.map((doc, index) => ({
        buffer: doc.document_data,
        originalname: doc.filename,
        mimetype: doc.mime_type,
        path: `/tmp/${doc.filename}_${Date.now()}_${index}`
      }));

      const ocrOptions = {
        language: options?.language || 'eng',
        extractFields: options?.extract_fields || false,
        detectStamps: options?.detect_stamps || false,
        detectSignatures: options?.detect_signatures || false,
      };

      const batchId = await ocrService.processBatch(files, ocrOptions);

      const response = {
        batch_id: batchId,
        total_documents: documents.length,
        status: 'processing',
        message: 'Batch processing started successfully',
      };

      callback(null, response);

    } catch (error) {
      console.error('gRPC ProcessBatch error:', error);
      callback(null, {
        batch_id: '',
        total_documents: 0,
        status: 'error',
        message: error.message,
      });
    }
  }

  async getBatchStatus(call, callback) {
    try {
      const { batch_id } = call.request;
      
      const status = await ocrService.getBatchStatus(batch_id);

      const results = (status.results || []).map(result => ({
        document_id: result.document_id || '',
        filename: result.filename || '',
        status: result.status || 'unknown',
        confidence: result.confidence || 0,
        text_length: result.text_length || 0,
        error_message: result.error_message || '',
      }));

      const response = {
        batch_id: status.batch_id,
        total_documents: status.total_documents || 0,
        completed: status.completed || 0,
        failed: status.failed || 0,
        processing: status.processing || 0,
        waiting: status.waiting || 0,
        results: results,
      };

      callback(null, response);

    } catch (error) {
      console.error('gRPC GetBatchStatus error:', error);
      callback(null, {
        batch_id: call.request.batch_id,
        total_documents: 0,
        completed: 0,
        failed: 0,
        processing: 0,
        waiting: 0,
        results: [],
      });
    }
  }

  async extractFields(call, callback) {
    try {
      const { document_id, field_definitions } = call.request;

      // Convert field definitions
      const fieldDefs = field_definitions.map(def => ({
        name: def.name,
        type: this.mapFieldTypeFromProto(def.type),
        pattern: def.pattern,
        required: def.required,
      }));

      const result = await documentProcessingService.extractFields(document_id, fieldDefs);

      // Convert fields to proto format
      const fieldsMap = {};
      if (result.extracted_fields) {
        Object.entries(result.extracted_fields).forEach(([key, field]) => {
          fieldsMap[key] = {
            name: field.name || key,
            value: field.value?.toString() || '',
            type: this.mapFieldType(field.type),
            confidence: field.confidence || 0,
            needs_review: field.needs_review || false,
          };
        });
      }

      const fieldErrors = (result.field_errors || []).map(error => ({
        field: error.field,
        error: error.error,
      }));

      const response = {
        document_id: result.document_id,
        extracted_fields: fieldsMap,
        field_errors: fieldErrors,
        overall_confidence: result.overall_confidence || 0,
        needs_manual_review: result.needs_manual_review || false,
      };

      callback(null, response);

    } catch (error) {
      console.error('gRPC ExtractFields error:', error);
      callback(null, {
        document_id: call.request.document_id,
        extracted_fields: {},
        field_errors: [{ field: 'general', error: error.message }],
        overall_confidence: 0,
        needs_manual_review: true,
      });
    }
  }

  async submitReview(call, callback) {
    try {
      const { document_id, corrections, review_status, comments, reviewer_id } = call.request;

      const statusMap = {
        0: 'pending',
        1: 'approved',
        2: 'rejected',
        3: 'needs_revision',
      };

      const mappedStatus = statusMap[review_status] || 'pending';

      const result = await documentProcessingService.submitReview(
        document_id,
        corrections,
        mappedStatus,
        comments,
        reviewer_id
      );

      const response = {
        success: result.success || false,
        review_id: result.review_id || '',
        document_id: result.document_id || document_id,
        status: review_status,
        message: result.message || 'Review submitted successfully',
      };

      callback(null, response);

    } catch (error) {
      console.error('gRPC SubmitReview error:', error);
      callback(null, {
        success: false,
        review_id: '',
        document_id: call.request.document_id,
        status: 2, // REJECTED
        message: error.message,
      });
    }
  }

  mapFieldType(type) {
    const typeMap = {
      'text': 0,
      'number': 1,
      'date': 2,
      'currency': 3,
    };
    return typeMap[type] || 0;
  }

  mapFieldTypeFromProto(protoType) {
    const typeMap = {
      0: 'text',
      1: 'number',
      2: 'date',
      3: 'currency',
    };
    return typeMap[protoType] || 'text';
  }

  start(port = 50051) {
    const address = `0.0.0.0:${port}`;
    this.server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
      if (err) {
        console.error('gRPC server bind error:', err);
        return;
      }
      
      console.log(`gRPC OCR Service running on port ${boundPort}`);
      this.server.start();
    });
  }

  stop() {
    this.server.forceShutdown();
  }
}

module.exports = OCRGRPCService;