import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';

export const AppBar: React.FC = () => {
  return (
    <MuiAppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          QuantEnergx
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit">
            <AccountIcon />
          </IconButton>

          <Button color="inherit">Logout</Button>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
