/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';

interface LanguageSwitcherProps {
  variant?: 'select' | 'menu';
  showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'select', 
  showLabel = true 
}) => {
  const { currentLanguage, changeLanguage, supportedLanguages, isRTL } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    changeLanguage(event.target.value);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuLanguageSelect = (languageCode: string) => {
    changeLanguage(languageCode);
    handleMenuClose();
  };

  if (variant === 'menu') {
    return (
      <Box>
        <IconButton
          onClick={handleMenuClick}
          color="inherit"
          aria-label="change language"
          sx={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: isRTL ? 'left' : 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: isRTL ? 'left' : 'right',
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleMenuLanguageSelect(language.code)}
              selected={language.code === currentLanguage}
              sx={{ 
                minWidth: 150,
                direction: language.code === 'ar' ? 'rtl' : 'ltr',
                textAlign: language.code === 'ar' ? 'right' : 'left'
              }}
            >
              <ListItemText 
                primary={language.nativeName}
                secondary={language.name}
              />
              {language.code === currentLanguage && (
                <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      {showLabel && (
        <Typography variant="body2" color="text.secondary">
          Language:
        </Typography>
      )}
      <FormControl size="small" variant="outlined">
        <Select
          value={currentLanguage}
          onChange={handleLanguageChange}
          sx={{ 
            minWidth: 120,
            '& .MuiSelect-select': {
              py: 1,
              direction: isRTL ? 'rtl' : 'ltr',
              textAlign: isRTL ? 'right' : 'left'
            }
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem 
              key={language.code} 
              value={language.code}
              sx={{ 
                direction: language.code === 'ar' ? 'rtl' : 'ltr',
                textAlign: language.code === 'ar' ? 'right' : 'left'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                width: '100%'
              }}>
                <Typography component="span">
                  {language.nativeName}
                </Typography>
                {language.code !== language.nativeName && (
                  <Typography 
                    component="span" 
                    variant="caption" 
                    color="text.secondary"
                  >
                    ({language.name})
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher;