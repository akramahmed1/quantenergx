import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { AppDispatch, RootState } from '../../store/store';
import { uploadDocument, uploadBatch } from '../../store/slices/ocrSlice';

export const OCRDocumentUpload: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isProcessing, error } = useSelector((state: RootState) => state.ocr);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState('eng');
  const [extractFields, setExtractFields] = useState(true);
  const [detectStamps, setDetectStamps] = useState(true);
  const [detectSignatures, setDetectSignatures] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const options = {
      language,
      extractFields: extractFields.toString(),
      detectStamps: detectStamps.toString(),
      detectSignatures: detectSignatures.toString(),
    };

    if (isBatchMode || selectedFiles.length > 1) {
      dispatch(uploadBatch({ files: selectedFiles, options }));
    } else {
      dispatch(uploadDocument({ file: selectedFiles[0], options }));
    }
  };

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'ara', name: 'Arabic' },
    { code: 'fas', name: 'Farsi/Persian' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'rus', name: 'Russian' },
    { code: 'fra', name: 'French' },
    { code: 'spa', name: 'Spanish' },
    { code: 'urd', name: 'Urdu' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        OCR Document Upload
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Documents
            </Typography>
            
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                mb: 2,
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: JPEG, PNG, TIFF, BMP, WebP, PDF (Max 50MB per file)
              </Typography>
            </Box>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => removeFile(index)}
                            disabled={isProcessing}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Upload Progress */}
            {isProcessing && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Processing documents...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Configuration */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              OCR Configuration
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isProcessing}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={extractFields}
                  onChange={(e) => setExtractFields(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Extract Trading Fields"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={detectStamps}
                  onChange={(e) => setDetectStamps(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Detect Stamps"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={detectSignatures}
                  onChange={(e) => setDetectSignatures(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Detect Signatures"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={isBatchMode}
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Batch Processing Mode"
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isProcessing}
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
            >
              {isProcessing ? 'Processing...' : 'Start OCR Processing'}
            </Button>

            {/* Feature Tags */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="Multi-language" size="small" />
                <Chip label="Field Extraction" size="small" />
                <Chip label="Stamp Detection" size="small" />
                <Chip label="Signature Detection" size="small" />
                <Chip label="Batch Processing" size="small" />
                <Chip label="Manual Review" size="small" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};