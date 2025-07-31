import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Switch, 
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Chip
} from '@mui/material';
import { useTranslation } from '../../i18n/I18nProvider';

interface BiometricAuthProps {
  onAuthSuccess: () => void;
  onAuthFailure: (error: string) => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthSuccess,
  onAuthFailure
}) => {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricSettings();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      // Check for Web Authentication API support
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(available);
      }
    } catch (error) {
      console.error('Biometric support check failed:', error);
      setIsSupported(false);
    }
  };

  const loadBiometricSettings = () => {
    const saved = localStorage.getItem('biometricEnabled');
    setIsEnabled(saved === 'true');
  };

  const enableBiometric = async () => {
    if (!isSupported) {
      onAuthFailure('Biometric authentication not supported');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Create credential for biometric authentication
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "QuantEnergx",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: "user@quantenergx.com",
            displayName: "QuantEnergx User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential) {
        localStorage.setItem('biometricEnabled', 'true');
        localStorage.setItem('biometricCredentialId', credential.id);
        setIsEnabled(true);
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Biometric setup failed:', error);
      onAuthFailure(error instanceof Error ? error.message : 'Biometric setup failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWithBiometric = async () => {
    if (!isEnabled || !isSupported) {
      onAuthFailure('Biometric authentication not enabled');
      return;
    }

    try {
      setIsAuthenticating(true);
      
      const credentialId = localStorage.getItem('biometricCredentialId');
      if (!credentialId) {
        throw new Error('No biometric credential found');
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: "public-key",
          }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      onAuthFailure(error instanceof Error ? error.message : 'Biometric authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const disableBiometric = () => {
    localStorage.removeItem('biometricEnabled');
    localStorage.removeItem('biometricCredentialId');
    setIsEnabled(false);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Biometric authentication is not supported on this device
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            {t('mobile.biometricAuth')}
          </Typography>
          <Chip 
            label={isEnabled ? t('auth.biometricEnabled') : t('auth.biometricDisabled')}
            color={isEnabled ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  enableBiometric();
                } else {
                  disableBiometric();
                }
              }}
              disabled={isAuthenticating}
            />
          }
          label={t('mobile.enableBiometric')}
        />

        {isEnabled && (
          <Box mt={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={authenticateWithBiometric}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? t('common.loading') : t('auth.biometricLogin')}
            </Button>
          </Box>
        )}

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            {t('auth.fingerprintAuth')} / {t('auth.faceAuth')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BiometricAuth;