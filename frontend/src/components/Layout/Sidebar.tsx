import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DocumentScanner as OCRIcon,
  TrendingUp as TradingIcon,
  Security as RiskIcon,
  Gavel as ComplianceIcon,
  Upload as UploadIcon,
  RateReview as ReviewIcon,
  Batch as BatchIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Trading', icon: <TradingIcon />, path: '/trading' },
    { text: 'Risk Management', icon: <RiskIcon />, path: '/risk' },
    { text: 'Compliance', icon: <ComplianceIcon />, path: '/compliance' },
  ];

  const ocrItems = [
    { text: 'Upload Documents', icon: <UploadIcon />, path: '/ocr/upload' },
    { text: 'Review Queue', icon: <ReviewIcon />, path: '/ocr/review' },
    { text: 'Batch Processing', icon: <BatchIcon />, path: '/ocr/batch' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          marginTop: '64px', // AppBar height
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            OCR & Documents
          </Typography>
        </Box>
        
        <List>
          {ocrItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};