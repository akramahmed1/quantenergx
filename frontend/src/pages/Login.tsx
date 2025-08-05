import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Paper,
  Container,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Security } from '@mui/icons-material';
import { login, selectAuth } from '../store/slices/authSlice';
import type { RootState, AppDispatch } from '../store/store';

// Default credentials from problem statement
const DEFAULT_CREDENTIALS = [
  { username: 'admin', password: 'Admin!2025Demo', role: 'Administrator' },
  { username: 'trader1', password: 'Trader!2025Demo', role: 'Trader' },
  { username: 'risk1', password: 'Risk!2025Demo', role: 'Risk Manager' },
];

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    mfaToken: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => selectAuth(state));

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    // If already authenticated, redirect to intended page
    if (auth.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, from]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const resultAction = await dispatch(
        login({
          username: formData.username,
          password: formData.password,
          mfaToken: formData.mfaToken || undefined,
        })
      );

      if (login.fulfilled.match(resultAction)) {
        // Login successful, navigate to intended page
        navigate(from, { replace: true });
      } else {
        // Login failed
        setError((resultAction.payload as string) || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleCredentialSelect = (credentials: (typeof DEFAULT_CREDENTIALS)[0]) => {
    setFormData(prev => ({
      ...prev,
      username: credentials.username,
      password: credentials.password,
    }));
    setShowCredentials(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Lock
              sx={{
                m: 1,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                padding: 1,
                fontSize: 40,
              }}
            />
            <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
              QuantEnergx
            </Typography>
            <Typography component="h2" variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Energy Trading Platform
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            {auth.loading.auth && (
              <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
                Signing in...
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* MFA Token field - only show if needed */}
              {formData.mfaToken !== undefined && (
                <TextField
                  margin="normal"
                  fullWidth
                  name="mfaToken"
                  label="MFA Token (if enabled)"
                  type="text"
                  id="mfaToken"
                  value={formData.mfaToken}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Security />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={auth.loading.auth}
              >
                Sign In
              </Button>

              <Grid container>
                <Grid item xs>
                  <Link
                    href="#"
                    variant="body2"
                    onClick={e => {
                      e.preventDefault();
                      setShowCredentials(!showCredentials);
                    }}
                  >
                    View Demo Credentials
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
              </Grid>
            </Box>

            {/* Demo Credentials */}
            {showCredentials && (
              <Card sx={{ mt: 2, width: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Demo Credentials
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click on any credential to auto-fill the form:
                  </Typography>
                  {DEFAULT_CREDENTIALS.map((cred, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleCredentialSelect(cred)}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {cred.role}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Username: {cred.username}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Password: {cred.password}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          {'Copyright © '}
          <Link color="inherit" href="https://github.com/akramahmed1/quantenergx">
            QuantEnergx
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
