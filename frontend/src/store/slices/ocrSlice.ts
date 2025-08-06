import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface DocumentField {
  name: string;
  value: string | number;
  type: 'text' | 'number' | 'date' | 'currency';
  confidence: number;
  needs_review: boolean;
}

export interface DocumentResult {
  document_id: string;
  extracted_text: string;
  confidence: number;
  language_detected: string;
  fields_extracted: Record<string, DocumentField> | null;
  stamps_detected: string[] | null;
  signatures_detected: string[] | null;
  processing_time_ms: number;
  created_at: string;
}

export interface BatchStatus {
  batch_id: string;
  total_documents: number;
  completed: number;
  failed: number;
  processing: number;
  waiting: number;
  results: Array<{
    document_id: string;
    filename: string;
    status: string;
    confidence: number;
    text_length: number;
  }>;
}

interface OCRState {
  documents: DocumentResult[];
  currentDocument: DocumentResult | null;
  batchStatus: BatchStatus | null;
  isProcessing: boolean;
  error: string | null;
  uploadProgress: number;
}

const initialState: OCRState = {
  documents: [],
  currentDocument: null,
  batchStatus: null,
  isProcessing: false,
  error: null,
  uploadProgress: 0,
};

// Async thunks
export const uploadDocument = createAsyncThunk(
  'ocr/uploadDocument',
  async (data: { file: File; options: any }) => {
    const formData = new FormData();
    formData.append('document', data.file);
    Object.entries(data.options).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const response = await fetch(`${API_URL}/api/v1/ocr/process`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
);

export const uploadBatch = createAsyncThunk(
  'ocr/uploadBatch',
  async (data: { files: File[]; options: any }) => {
    const formData = new FormData();
    data.files.forEach(file => {
      formData.append('documents', file);
    });
    Object.entries(data.options).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const response = await fetch(`${API_URL}/api/v1/ocr/batch`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Batch upload failed');
    }

    return response.json();
  }
);

export const getBatchStatus = createAsyncThunk('ocr/getBatchStatus', async (batchId: string) => {
  const response = await fetch(`${API_URL}/api/v1/ocr/batch/${batchId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get batch status');
  }

  return response.json();
});

export const submitReview = createAsyncThunk(
  'ocr/submitReview',
  async (data: {
    documentId: string;
    corrections: Record<string, any>;
    reviewStatus: 'approved' | 'rejected' | 'needs_revision';
    comments?: string;
  }) => {
    const response = await fetch(`${API_URL}/api/v1/ocr/review/${data.documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        corrections: data.corrections,
        reviewStatus: data.reviewStatus,
        comments: data.comments,
      }),
    });

    if (!response.ok) {
      throw new Error('Review submission failed');
    }

    return response.json();
  }
);

const ocrSlice = createSlice({
  name: 'ocr',
  initialState,
  reducers: {
    setCurrentDocument: (state, action: PayloadAction<DocumentResult | null>) => {
      state.currentDocument = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    addDocument: (state, action: PayloadAction<DocumentResult>) => {
      state.documents.push(action.payload);
    },
  },
  extraReducers: builder => {
    // Upload document
    builder
      .addCase(uploadDocument.pending, state => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.documents.push(action.payload);
        state.currentDocument = action.payload;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message || 'Upload failed';
      });

    // Upload batch
    builder
      .addCase(uploadBatch.pending, state => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(uploadBatch.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.batchStatus = action.payload;
      })
      .addCase(uploadBatch.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message || 'Batch upload failed';
      });

    // Get batch status
    builder
      .addCase(getBatchStatus.fulfilled, (state, action) => {
        state.batchStatus = action.payload;
      })
      .addCase(getBatchStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to get batch status';
      });

    // Submit review
    builder
      .addCase(submitReview.pending, state => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, state => {
        state.isProcessing = false;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message || 'Review submission failed';
      });
  },
});

export const { setCurrentDocument, setUploadProgress, clearError, addDocument } = ocrSlice.actions;
export default ocrSlice.reducer;
