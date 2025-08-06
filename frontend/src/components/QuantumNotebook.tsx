import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Toolbar,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  TextField,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown' | 'raw';
  content: string;
  outputs?: any[];
  metadata?: Record<string, any>;
  executionCount?: number | null;
}

export interface NotebookData {
  id: string;
  name: string;
  cells: NotebookCell[];
  metadata: {
    kernelspec: {
      name: string;
      display_name: string;
      language: string;
    };
    language_info: {
      name: string;
      version: string;
    };
  };
  lastModified: Date;
}

interface QuantumNotebookProps {
  notebookId?: string;
  initialNotebook?: NotebookData;
  readOnly?: boolean;
  height?: number | string;
  onSave?: (notebook: NotebookData) => void;
  onCellExecute?: (cellId: string, code: string) => Promise<any>;
  compactMode?: boolean;
}

const QuantumNotebook: React.FC<QuantumNotebookProps> = ({
  notebookId,
  initialNotebook,
  readOnly = false,
  height = '600px',
  onSave,
  onCellExecute,
  compactMode = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [notebook, setNotebook] = useState<NotebookData | null>(initialNotebook || null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [executingCells, setExecutingCells] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [kernelStatus, setKernelStatus] = useState<'idle' | 'busy' | 'dead'>('idle');
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const notebookContainerRef = useRef<HTMLDivElement>(null);

  // Sample notebook for demo purposes
  const createSampleNotebook = useCallback((): NotebookData => ({
    id: 'quantum-trading-analysis',
    name: 'Quantum Trading Analysis',
    cells: [
      {
        id: 'cell-1',
        type: 'markdown',
        content: '# Quantum Energy Trading Analysis\n\nThis notebook demonstrates quantum-enhanced trading algorithms for energy commodity markets.',
      },
      {
        id: 'cell-2',
        type: 'code',
        content: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit, Aer, execute
from qiskit.algorithms import QAOA
import plotly.graph_objects as go

# Initialize quantum trading parameters
print("Quantum Trading System Initialized")
quantum_advantage = True`,
        outputs: [],
      },
      {
        id: 'cell-3',
        type: 'code',
        content: `# Simulate market data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=100, freq='D')
prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
market_data = pd.DataFrame({'date': dates, 'price': prices})

print(f"Generated {len(market_data)} days of market data")
market_data.head()`,
        outputs: [],
      },
      {
        id: 'cell-4',
        type: 'code',
        content: `# Quantum circuit for price prediction
qc = QuantumCircuit(3, 3)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure_all()

print("Quantum price prediction circuit:")
print(qc.draw(output='text'))`,
        outputs: [],
      },
    ],
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3 (Quantum)',
        language: 'python',
      },
      language_info: {
        name: 'python',
        version: '3.9.0',
      },
    },
    lastModified: new Date(),
  }), []);

  // Load notebook
  useEffect(() => {
    if (!notebook && !initialNotebook) {
      if (notebookId) {
        setLoading(true);
        // Simulate API call to load notebook
        setTimeout(() => {
          setNotebook(createSampleNotebook());
          setLoading(false);
        }, 1000);
      } else {
        setNotebook(createSampleNotebook());
      }
    }
  }, [notebookId, initialNotebook, notebook, createSampleNotebook]);

  const handleCellExecute = useCallback(async (cellId: string) => {
    if (!notebook || readOnly) return;

    const cell = notebook.cells.find(c => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    setExecutingCells(prev => new Set(prev).add(cellId));
    setKernelStatus('busy');

    try {
      let output: any;
      if (onCellExecute) {
        output = await onCellExecute(cellId, cell.content);
      } else {
        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        output = {
          output_type: 'execute_result',
          execution_count: (cell.executionCount || 0) + 1,
          data: {
            'text/plain': `Executed: ${cell.content.slice(0, 50)}...`,
          },
        };
      }

      setNotebook(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          cells: prev.cells.map(c => 
            c.id === cellId 
              ? { ...c, outputs: [output], executionCount: (c.executionCount || 0) + 1 }
              : c
          ),
        };
      });
    } catch (err) {
      const error = err as Error;
      setNotebook(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          cells: prev.cells.map(c => 
            c.id === cellId 
              ? { 
                  ...c, 
                  outputs: [{
                    output_type: 'error',
                    ename: 'ExecutionError',
                    evalue: error.message,
                    traceback: [error.stack || error.message],
                  }],
                }
              : c
          ),
        };
      });
    } finally {
      setExecutingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellId);
        return newSet;
      });
      setKernelStatus('idle');
    }
  }, [notebook, readOnly, onCellExecute]);

  const handleCellContentChange = useCallback((cellId: string, content: string) => {
    if (readOnly) return;
    
    setNotebook(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId ? { ...c, content } : c
        ),
        lastModified: new Date(),
      };
    });
  }, [readOnly]);

  const handleAddCell = useCallback((type: 'code' | 'markdown' | 'raw' = 'code', afterCellId?: string) => {
    if (readOnly) return;

    const newCell: NotebookCell = {
      id: `cell-${Date.now()}`,
      type,
      content: type === 'markdown' ? '# New Cell' : '',
      outputs: [],
    };

    setNotebook(prev => {
      if (!prev) return prev;
      
      const cells = [...prev.cells];
      if (afterCellId) {
        const index = cells.findIndex(c => c.id === afterCellId);
        cells.splice(index + 1, 0, newCell);
      } else {
        cells.push(newCell);
      }

      return { ...prev, cells, lastModified: new Date() };
    });

    setSelectedCellId(newCell.id);
  }, [readOnly]);

  const handleDeleteCell = useCallback((cellId: string) => {
    if (readOnly || !notebook || notebook.cells.length <= 1) return;

    setNotebook(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cells: prev.cells.filter(c => c.id !== cellId),
        lastModified: new Date(),
      };
    });
  }, [readOnly, notebook]);

  const handleSave = useCallback(() => {
    if (!notebook || readOnly) return;
    
    if (onSave) {
      onSave(notebook);
    } else {
      // Simulate save
      console.log('Saving notebook:', notebook.name);
    }
  }, [notebook, readOnly, onSave]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const renderCell = (cell: NotebookCell) => {
    const isExecuting = executingCells.has(cell.id);
    const isSelected = selectedCellId === cell.id;

    return (
      <Card 
        key={cell.id}
        sx={{ 
          mb: 1, 
          border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
        }}
        onClick={() => setSelectedCellId(cell.id)}
      >
        <CardContent sx={{ p: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={cell.type} size="small" />
              {cell.type === 'code' && cell.executionCount && (
                <Typography variant="caption" color="text.secondary">
                  [{cell.executionCount}]
                </Typography>
              )}
            </Box>
            <Box display="flex" alignItems="center">
              {cell.type === 'code' && !readOnly && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellExecute(cell.id);
                  }}
                  disabled={isExecuting}
                >
                  {isExecuting ? <CircularProgress size={16} /> : <PlayIcon />}
                </IconButton>
              )}
              {!readOnly && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCell(cell.id);
                  }}
                  disabled={notebook?.cells.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={compactMode ? 5 : 20}
            value={cell.content}
            onChange={(e) => handleCellContentChange(cell.id, e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              readOnly,
              style: {
                fontFamily: cell.type === 'code' ? 'monospace' : 'inherit',
                fontSize: cell.type === 'code' ? '0.875rem' : 'inherit',
              },
            }}
          />

          {/* Cell outputs */}
          {cell.outputs && cell.outputs.length > 0 && (
            <Box mt={1} p={1} bgcolor="grey.50" borderRadius={1}>
              {cell.outputs.map((output, idx) => (
                <Box key={idx}>
                  {output.output_type === 'execute_result' && (
                    <pre style={{ 
                      margin: 0, 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {output.data?.['text/plain'] || JSON.stringify(output.data, null, 2)}
                    </pre>
                  )}
                  {output.output_type === 'error' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="caption" component="pre">
                        {output.ename}: {output.evalue}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const toolbar = (
    <Toolbar variant="dense" sx={{ px: 1 }}>
      <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} size="small">
        <MenuIcon />
      </IconButton>
      
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
        {notebook?.name || 'Untitled Notebook'}
      </Typography>

      <Chip
        label={kernelStatus}
        color={kernelStatus === 'idle' ? 'success' : kernelStatus === 'busy' ? 'warning' : 'error'}
        size="small"
        sx={{ mr: 1 }}
      />

      {!readOnly && (
        <>
          <IconButton onClick={handleSave} size="small" title="Save">
            <SaveIcon />
          </IconButton>
          <IconButton 
            onClick={(e) => setAnchorEl(e.currentTarget)} 
            size="small" 
            title="Add Cell"
          >
            <AddIcon />
          </IconButton>
        </>
      )}

      <IconButton onClick={toggleFullscreen} size="small" title="Toggle Fullscreen">
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
    </Toolbar>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!notebook) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No notebook loaded
      </Alert>
    );
  }

  const content = (
    <Box
      ref={notebookContainerRef}
      sx={{
        height: isFullscreen ? '100vh' : height,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.modal,
        }),
      }}
    >
      {toolbar}
      
      <Box display="flex" flexGrow={1} overflow="hidden">
        {/* Sidebar */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              position: isFullscreen ? 'absolute' : 'relative',
              height: '100%',
            },
          }}
        >
          <List dense>
            <ListItem>
              <Typography variant="subtitle2">Kernel: {notebook.metadata.kernelspec.display_name}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography variant="subtitle2">Cells ({notebook.cells.length})</Typography>
            </ListItem>
            {notebook.cells.map((cell, index) => (
              <ListItemButton
                key={cell.id}
                selected={selectedCellId === cell.id}
                onClick={() => setSelectedCellId(cell.id)}
                dense
              >
                <ListItemIcon>
                  <Chip label={cell.type} size="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Cell ${index + 1}`}
                  secondary={cell.content.slice(0, 30) + (cell.content.length > 30 ? '...' : '')}
                />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        {/* Notebook content */}
        <Box
          flexGrow={1}
          p={2}
          overflow="auto"
          sx={{ ml: sidebarOpen && !isMobile ? 0 : 0 }}
        >
          {notebook.cells.map(renderCell)}
        </Box>
      </Box>

      {/* Add Cell Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { handleAddCell('code'); setAnchorEl(null); }}>
          Code Cell
        </MenuItem>
        <MenuItem onClick={() => { handleAddCell('markdown'); setAnchorEl(null); }}>
          Markdown Cell
        </MenuItem>
        <MenuItem onClick={() => { handleAddCell('raw'); setAnchorEl(null); }}>
          Raw Cell
        </MenuItem>
      </Menu>
    </Box>
  );

  return content;
};

export default QuantumNotebook;