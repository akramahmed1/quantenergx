import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { selectAuth, setToken } from '../store/slices/authSlice';
import type { RootState } from '../store/store';

/**
 * ProtectedRoute Component
 *
 * A higher-order component that protects routes requiring authentication.
 * Features:
 * - Redirects unauthenticated users to login page
 * - Preserves intended destination for post-login redirect
 * - Automatically restores authentication from localStorage
 * - Shows loading state during authentication check
 *
 * @param children - React components to render when authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useSelector((state: RootState) => selectAuth(state));
  const dispatch = useDispatch();
  const location = useLocation();

  // Attempt to restore authentication state from localStorage on mount
  useEffect(() => {
    // Check if there's a token in localStorage but not in state
    const token = localStorage.getItem('token');
    if (token && !auth.isAuthenticated) {
      // Restore authentication state - this triggers a re-render with isAuthenticated = true
      dispatch(setToken(token));
    }
  }, [auth.isAuthenticated, dispatch]);

  // Show loading spinner while checking authentication
  if (auth.loading.auth) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Authenticating...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login with current location for post-login redirect
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
