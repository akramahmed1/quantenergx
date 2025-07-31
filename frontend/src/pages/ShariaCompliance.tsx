/**
 * Sharia Compliance Dashboard Component
 * Provides interface for Islamic finance compliance checking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CheckCircle,
  Cancel,
  Info,
  Bookmark
} from '@mui/icons-material';
import { useTranslation } from '../../i18n/I18nProvider';

interface ShariaComplianceResult {
  success: boolean;
  instrument_id: string;
  is_sharia_compliant: boolean;
  compliance_score: number;
  checks: {
    sector_compliance: ComplianceCheck;
    interest_check: ComplianceCheck;
    speculation_check: ComplianceCheck;
    asset_backing: ComplianceCheck;
    contract_structure: ComplianceCheck;
  };
  certification?: ShariaCertificate;
  recommendations: string[];
}

interface ComplianceCheck {
  compliant: boolean;
  score: number;
  details: any;
}

interface ShariaCertificate {
  certificate_id: string;
  issued_date: string;
  valid_until: string;
  certifying_authority: string;
}

interface Instrument {
  id: string;
  name: string;
  sector: string;
  interest_rate: number;
  financing_type: string;
  asset_backed: boolean;
  asset_backing_ratio: number;
  contract_structure: string;
  type: string;
  volatility: number;
  allows_short_selling: boolean;
  max_leverage: number;
}

const ShariaComplianceDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [complianceResults, setComplianceResults] = useState<ShariaComplianceResult[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>({
    id: '',
    name: '',
    sector: 'solar_energy',
    interest_rate: 0,
    financing_type: 'asset_based',
    asset_backed: true,
    asset_backing_ratio: 0.6,
    contract_structure: 'murabaha',
    type: 'spot',
    volatility: 20,
    allows_short_selling: false,
    max_leverage: 1
  });
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ShariaCertificate | null>(null);
  const [tradingTimeStatus, setTradingTimeStatus] = useState<any>(null);
  const [shariaProducts, setShariaProducts] = useState<any[]>([]);

  const isRTL = language === 'ar';

  useEffect(() => {
    checkTradingTime();
    loadShariaProducts();
  }, []);

  const checkTradingTime = async () => {
    try {
      const response = await fetch('/api/v1/sharia/trading-time');
      const data = await response.json();
      setTradingTimeStatus(data.trading_time_check);
    } catch (error) {
      console.error('Error checking trading time:', error);
    }
  };

  const loadShariaProducts = async () => {
    try {
      const response = await fetch('/api/v1/sharia/products');
      const data = await response.json();
      if (data.success) {
        setShariaProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading Sharia products:', error);
    }
  };

  const checkCompliance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/sharia/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedInstrument),
      });
      const result = await response.json();
      
      if (result.success) {
        setComplianceResults([result, ...complianceResults]);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle color="success" />
    ) : (
      <Cancel color="error" />
    );
  };

  const getComplianceColor = (compliant: boolean) => {
    return compliant ? 'success' : 'error';
  };

  const getRatingColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const showCertificate = (certificate: ShariaCertificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateDialog(true);
  };

  return (
    <Box sx={{ p: 3, direction: isRTL ? 'rtl' : 'ltr' }}>
      <Typography variant="h4" gutterBottom>
        {t('sharia.title')}
      </Typography>

      {/* Trading Time Status */}
      {tradingTimeStatus && (
        <Alert 
          severity={tradingTimeStatus.valid ? 'success' : 'warning'}
          sx={{ mb: 3 }}
        >
          {tradingTimeStatus.reason}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Compliance Check Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('sharia.check')}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('trading.commodity')}
                    value={selectedInstrument.name}
                    onChange={(e) => setSelectedInstrument({...selectedInstrument, name: e.target.value})}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Sector"
                    value={selectedInstrument.sector}
                    onChange={(e) => setSelectedInstrument({...selectedInstrument, sector: e.target.value})}
                  >
                    <MenuItem value="solar_energy">Solar Energy</MenuItem>
                    <MenuItem value="wind_energy">Wind Energy</MenuItem>
                    <MenuItem value="natural_gas">Natural Gas</MenuItem>
                    <MenuItem value="crude_oil">Crude Oil</MenuItem>
                    <MenuItem value="alcohol_production">Alcohol (Prohibited)</MenuItem>
                    <MenuItem value="tobacco">Tobacco (Prohibited)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Contract Structure"
                    value={selectedInstrument.contract_structure}
                    onChange={(e) => setSelectedInstrument({...selectedInstrument, contract_structure: e.target.value})}
                  >
                    <MenuItem value="murabaha">Murabaha</MenuItem>
                    <MenuItem value="ijara">Ijara</MenuItem>
                    <MenuItem value="salam">Salam</MenuItem>
                    <MenuItem value="istisna">Istisna</MenuItem>
                    <MenuItem value="spot">Spot</MenuItem>
                    <MenuItem value="conventional">Conventional (Non-Sharia)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Interest Rate (%)"
                    value={selectedInstrument.interest_rate}
                    onChange={(e) => setSelectedInstrument({...selectedInstrument, interest_rate: parseFloat(e.target.value)})}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Asset Backing Ratio"
                    value={selectedInstrument.asset_backing_ratio}
                    onChange={(e) => setSelectedInstrument({...selectedInstrument, asset_backing_ratio: parseFloat(e.target.value)})}
                    inputProps={{ step: 0.1, min: 0, max: 1 }}
                    helperText="Minimum 0.51 (51%) required"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={checkCompliance}
                    disabled={loading || !selectedInstrument.name}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? t('common.loading') : t('sharia.check')}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sharia-Compliant Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('sharia.products')}
              </Typography>
              
              <List>
                {shariaProducts.map((product, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Bookmark color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={product.name}
                      secondary={`${product.contract_structure} - ${product.minimum_quantity} ${product.unit}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Results
              </Typography>
              
              {complianceResults.length === 0 ? (
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  No compliance checks performed yet
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Instrument</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Sector</TableCell>
                        <TableCell>Interest</TableCell>
                        <TableCell>Speculation</TableCell>
                        <TableCell>Asset Backing</TableCell>
                        <TableCell>Contract</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {complianceResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.instrument_id}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getComplianceIcon(result.is_sharia_compliant)}
                              label={result.is_sharia_compliant ? t('sharia.compliant') : t('sharia.nonCompliant')}
                              color={getComplianceColor(result.is_sharia_compliant)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={result.compliance_score}
                                  color={getRatingColor(result.compliance_score)}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {result.compliance_score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {getComplianceIcon(result.checks.sector_compliance.compliant)}
                          </TableCell>
                          <TableCell>
                            {getComplianceIcon(result.checks.interest_check.compliant)}
                          </TableCell>
                          <TableCell>
                            {getComplianceIcon(result.checks.speculation_check.compliant)}
                          </TableCell>
                          <TableCell>
                            {getComplianceIcon(result.checks.asset_backing.compliant)}
                          </TableCell>
                          <TableCell>
                            {getComplianceIcon(result.checks.contract_structure.compliant)}
                          </TableCell>
                          <TableCell>
                            {result.certification && (
                              <Button
                                size="small"
                                onClick={() => showCertificate(result.certification!)}
                              >
                                {t('sharia.certificate')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        {complianceResults.length > 0 && complianceResults[0].recommendations.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('sharia.recommendations')}
                </Typography>
                
                <List>
                  {complianceResults[0].recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Info color="info" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Certificate Dialog */}
      <Dialog open={showCertificateDialog} onClose={() => setShowCertificateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sharia.certificate')}</DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Certificate ID:</strong> {selectedCertificate.certificate_id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Certifying Authority:</strong> {selectedCertificate.certifying_authority}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Issued Date:</strong> {new Date(selectedCertificate.issued_date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Valid Until:</strong> {new Date(selectedCertificate.valid_until).toLocaleDateString()}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="success">
                This instrument has been certified as Sharia-compliant by our Islamic finance board.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCertificateDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShariaComplianceDashboard;