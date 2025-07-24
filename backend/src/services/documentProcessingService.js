const { v4: uuidv4 } = require('uuid');
const redis = require('redis');

class DocumentProcessingService {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
  }

  async extractFields(documentId, fieldDefinitions) {
    try {
      // Get the OCR result for this document
      const ocrResultKey = `ocr:result:${documentId}`;
      const ocrResultStr = await this.redisClient.get(ocrResultKey);
      
      if (!ocrResultStr) {
        throw new Error('Document not found or OCR result expired');
      }
      
      const ocrResult = JSON.parse(ocrResultStr);
      const text = ocrResult.text;
      
      const extractedFields = {};
      const fieldErrors = [];
      
      for (const fieldDef of fieldDefinitions) {
        try {
          const value = await this._extractSingleField(text, fieldDef);
          extractedFields[fieldDef.name] = {
            value,
            type: fieldDef.type,
            confidence: this._calculateFieldConfidence(value, fieldDef),
            needs_review: this._needsReview(value, fieldDef)
          };
        } catch (error) {
          fieldErrors.push({
            field: fieldDef.name,
            error: error.message
          });
        }
      }
      
      const result = {
        document_id: documentId,
        extracted_fields: extractedFields,
        field_errors: fieldErrors,
        overall_confidence: this._calculateOverallConfidence(extractedFields),
        needs_manual_review: Object.values(extractedFields).some(field => field.needs_review),
        extraction_timestamp: new Date().toISOString()
      };
      
      // Store extraction result
      await this._storeExtractionResult(documentId, result);
      
      return result;
      
    } catch (error) {
      throw new Error(`Field extraction failed: ${error.message}`);
    }
  }

  async submitReview(documentId, corrections, reviewStatus, comments, reviewerId) {
    try {
      const reviewData = {
        document_id: documentId,
        reviewer_id: reviewerId,
        corrections,
        review_status: reviewStatus,
        comments,
        review_timestamp: new Date().toISOString()
      };
      
      // Store review data
      const reviewKey = `review:${documentId}:${uuidv4()}`;
      await this.redisClient.setex(
        reviewKey,
        3600 * 24 * 30, // 30 days
        JSON.stringify(reviewData)
      );
      
      // Update document status
      await this._updateDocumentStatus(documentId, reviewStatus);
      
      // If approved, trigger ETL pipeline
      if (reviewStatus === 'approved') {
        await this._triggerETLPipeline(documentId, corrections);
      }
      
      return {
        success: true,
        review_id: reviewKey.split(':').pop(),
        document_id: documentId,
        status: reviewStatus,
        message: 'Review submitted successfully'
      };
      
    } catch (error) {
      throw new Error(`Review submission failed: ${error.message}`);
    }
  }

  async _extractSingleField(text, fieldDefinition) {
    const { name, type, pattern, required = false } = fieldDefinition;
    
    let extractedValue = null;
    
    if (pattern) {
      // Use custom regex pattern if provided
      const regex = new RegExp(pattern, 'i');
      const match = text.match(regex);
      extractedValue = match ? match[1] : null;
    } else {
      // Use default patterns based on field type
      extractedValue = await this._extractByType(text, name, type);
    }
    
    if (required && !extractedValue) {
      throw new Error(`Required field '${name}' not found`);
    }
    
    return this._formatValue(extractedValue, type);
  }

  async _extractByType(text, fieldName, type) {
    const patterns = {
      contract_number: /(?:contract|agreement|deal)\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      volume: /(?:volume|quantity|amount)\s*:?\s*([\d,]+\.?\d*)\s*(?:barrels?|bbl|tons?|mt|gallons?)/i,
      price: /(?:price|rate|cost)\s*:?\s*\$?([\d,]+\.?\d*)/i,
      commodity: /(crude\s*oil|natural\s*gas|lng|gasoline|diesel|fuel\s*oil|heating\s*oil)/i,
      counterparty: /(?:counterparty|buyer|seller|client)\s*:?\s*([A-Z][A-Za-z\s&,.]+)/i,
      delivery_location: /(?:delivery|location|terminal|depot)\s*:?\s*([A-Z][A-Za-z\s,.]+)/i,
      incoterms: /(FOB|CIF|CFR|DAP|DDP|FAS|FCA|CPT|CIP)/i,
      total_value: /(?:total|amount|value)\s*:?\s*\$?([\d,]+\.?\d*)/i
    };
    
    const fieldPattern = patterns[fieldName.toLowerCase()] || patterns[type];
    if (!fieldPattern) {
      return null;
    }
    
    const match = text.match(fieldPattern);
    return match ? match[1] : null;
  }

  _formatValue(value, type) {
    if (!value) return null;
    
    switch (type) {
      case 'number':
        return parseFloat(value.replace(/,/g, ''));
      case 'currency':
        return parseFloat(value.replace(/[$,]/g, ''));
      case 'date':
        return this._parseDate(value);
      case 'text':
      default:
        return value.trim();
    }
  }

  _parseDate(dateString) {
    // Handle various date formats
    const formats = [
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, part1, part2, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        
        // Assume MM/DD/YYYY format for now
        // In production, this should be configurable
        return `${fullYear}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
      }
    }
    
    return dateString; // Return as-is if no format matches
  }

  _calculateFieldConfidence(value, fieldDefinition) {
    if (!value) return 0;
    
    let confidence = 70; // Base confidence
    
    // Increase confidence based on field characteristics
    if (fieldDefinition.type === 'number' && !isNaN(value)) {
      confidence += 20;
    }
    
    if (fieldDefinition.type === 'currency' && !isNaN(value)) {
      confidence += 20;
    }
    
    if (fieldDefinition.type === 'date' && this._isValidDate(value)) {
      confidence += 15;
    }
    
    // Decrease confidence for uncertain extractions
    if (typeof value === 'string' && value.length < 3) {
      confidence -= 20;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  _calculateOverallConfidence(extractedFields) {
    const confidenceValues = Object.values(extractedFields).map(field => field.confidence);
    if (confidenceValues.length === 0) return 0;
    
    return confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
  }

  _needsReview(value, fieldDefinition) {
    if (!value) return true;
    
    // Fields with low confidence need review
    const confidence = this._calculateFieldConfidence(value, fieldDefinition);
    if (confidence < 80) return true;
    
    // Critical fields always need review
    const criticalFields = ['volume', 'price', 'total_value', 'counterparty'];
    if (criticalFields.includes(fieldDefinition.name.toLowerCase())) {
      return true;
    }
    
    return false;
  }

  _isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  async _storeExtractionResult(documentId, result) {
    try {
      const key = `extraction:${documentId}`;
      await this.redisClient.setex(
        key,
        3600 * 24 * 30, // 30 days
        JSON.stringify(result)
      );
    } catch (error) {
      console.error('Failed to store extraction result:', error);
    }
  }

  async _updateDocumentStatus(documentId, status) {
    try {
      const statusKey = `document:status:${documentId}`;
      const statusData = {
        status,
        updated_at: new Date().toISOString()
      };
      
      await this.redisClient.setex(
        statusKey,
        3600 * 24 * 30, // 30 days
        JSON.stringify(statusData)
      );
    } catch (error) {
      console.error('Failed to update document status:', error);
    }
  }

  async _triggerETLPipeline(documentId, correctedData) {
    try {
      // This would typically trigger an ETL pipeline
      // For now, just log the trigger
      console.log(`ETL pipeline triggered for document ${documentId}`);
      console.log('Corrected data:', correctedData);
      
      // In production, this would:
      // 1. Transform the data to the target schema
      // 2. Validate business rules
      // 3. Load into the trading system database
      // 4. Trigger downstream processes (risk calculations, compliance checks)
      // 5. Send notifications to relevant stakeholders
      
      return {
        success: true,
        message: 'ETL pipeline triggered successfully'
      };
    } catch (error) {
      console.error('ETL pipeline trigger failed:', error);
      throw error;
    }
  }
}

module.exports = new DocumentProcessingService();
