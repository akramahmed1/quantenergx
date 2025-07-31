/**
 * ESG Dashboard Component
 * Environmental, Social, and Governance scoring interface
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Nature,
  People,
  BusinessCenter,
  TrendingUp,
  Star,
  Lightbulb
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useTranslation } from '../../i18n/I18nProvider';

interface ESGScore {
  success: boolean;
  entity_id: string;
  entity_name: string;
  overall_score: number;
  rating: string;
  scores: {
    environmental: ESGCategoryScore;
    social: ESGCategoryScore;
    governance: ESGCategoryScore;
  };
  recommendations: ESGRecommendation[];
  benchmark_comparison: BenchmarkComparison;
  last_updated: string;
}

interface ESGCategoryScore {
  score: number;
  factors: Record<string, ESGFactor>;
  category: string;
}

interface ESGFactor {
  score: number;
  weight: number;
  value?: any;
  details?: any;
}

interface ESGRecommendation {
  category: string;
  priority: string;
  action: string;
  impact: string;
}

interface BenchmarkComparison {
  industry_average: number;
  entity_score: number;
  percentile: number;
  ranking: string;
}

interface Entity {
  id: string;
  name: string;
  sector: string;
  carbon_intensity: number;
  renewable_energy_ratio: number;
  // ... other ESG factors
}

const ESGDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [esgResults, setESGResults] = useState<ESGScore[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity>({
    id: '',
    name: '',
    sector: 'renewable_energy',
    carbon_intensity: 5,
    renewable_energy_ratio: 0.8
  });
  const [trendData, setTrendData] = useState<any>(null);

  const isRTL = language === 'ar';

  const calculateESGScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/esg/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedEntity),
      });
      const result = await response.json();
      
      if (result.success) {
        setESGResults([result, ...esgResults]);
        // Load trend data for this entity
        loadTrendData(result.entity_id);
      }
    } catch (error) {
      console.error('Error calculating ESG score:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async (entityId: string) => {
    try {
      const response = await fetch(`/api/v1/esg/trends/${entityId}?time_range=1Y`);
      const data = await response.json();
      if (data.success) {
        setTrendData(data);
      }
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'AAA':
      case 'AA':
      case 'A':
        return 'success';
      case 'BBB':
      case 'BB':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const radarData = esgResults.length > 0 ? [
    {
      factor: 'Environmental',
      score: esgResults[0].scores.environmental.score,
    },
    {
      factor: 'Social',
      score: esgResults[0].scores.social.score,
    },
    {
      factor: 'Governance',
      score: esgResults[0].scores.governance.score,
    },
  ] : [];

  const trendChartData = trendData ? 
    trendData.trend_data.overall.map((score: number, index: number) => ({
      month: `Month ${index + 1}`,
      environmental: trendData.trend_data.environmental[index],
      social: trendData.trend_data.social[index],
      governance: trendData.trend_data.governance[index],
      overall: score
    })) : [];

  return (
    <Box sx={{ p: 3, direction: isRTL ? 'rtl' : 'ltr' }}>
      <Typography variant="h4" gutterBottom>
        {t('esg.title')}
      </Typography>

      <Grid container spacing={3}>
        {/* ESG Scoring Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculate ESG Score
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Entity Name"
                    value={selectedEntity.name}
                    onChange={(e) => setSelectedEntity({...selectedEntity, name: e.target.value})}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Sector"
                    value={selectedEntity.sector}
                    onChange={(e) => setSelectedEntity({...selectedEntity, sector: e.target.value})}
                    SelectProps={{ native: true }}
                  >
                    <option value="renewable_energy">Renewable Energy</option>
                    <option value="oil_gas">Oil & Gas</option>
                    <option value="utilities">Utilities</option>
                    <option value="coal">Coal</option>
                    <option value="nuclear">Nuclear</option>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Carbon Intensity (kg CO2/unit)"
                    value={selectedEntity.carbon_intensity}
                    onChange={(e) => setSelectedEntity({...selectedEntity, carbon_intensity: parseFloat(e.target.value)})}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Renewable Energy Ratio (0-1)"
                    value={selectedEntity.renewable_energy_ratio}
                    onChange={(e) => setSelectedEntity({...selectedEntity, renewable_energy_ratio: parseFloat(e.target.value)})}
                    inputProps={{ step: 0.1, min: 0, max: 1 }}
                    helperText="Percentage of renewable energy in operations"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={calculateESGScore}
                    disabled={loading || !selectedEntity.name}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? t('common.loading') : 'Calculate ESG Score'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ESG Score Overview */}
        {esgResults.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ESG Score Overview
                </Typography>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" color="primary">
                    {esgResults[0].overall_score}
                  </Typography>
                  <Chip
                    label={esgResults[0].rating}
                    color={getRatingColor(esgResults[0].rating)}
                    size="large"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {esgResults[0].entity_name}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Nature color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">
                        {Math.round(esgResults[0].scores.environmental.score)}
                      </Typography>
                      <Typography variant="body2">
                        {t('esg.environmental')}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={esgResults[0].scores.environmental.score}
                        color={getScoreColor(esgResults[0].scores.environmental.score)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <People color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">
                        {Math.round(esgResults[0].scores.social.score)}
                      </Typography>
                      <Typography variant="body2">
                        {t('esg.social')}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={esgResults[0].scores.social.score}
                        color={getScoreColor(esgResults[0].scores.social.score)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BusinessCenter color="warning" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">
                        {Math.round(esgResults[0].scores.governance.score)}
                      </Typography>
                      <Typography variant="body2">
                        {t('esg.governance')}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={esgResults[0].scores.governance.score}
                        color={getScoreColor(esgResults[0].scores.governance.score)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ESG Trends Chart */}
        {trendData && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('esg.trends')}
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall" stroke="#2196f3" strokeWidth={3} />
                    <Line type="monotone" dataKey="environmental" stroke="#4caf50" strokeWidth={2} />
                    <Line type="monotone" dataKey="social" stroke="#ff9800" strokeWidth={2} />
                    <Line type="monotone" dataKey="governance" stroke="#9c27b0" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  {trendData.trend_analysis.direction === 'improving' ? 
                    `Improving trend: ${trendData.trend_analysis.rate_of_change}` :
                    'ESG performance trend analysis'
                  }
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ESG Radar Chart */}
        {esgResults.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ESG Profile
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="ESG Score"
                      dataKey="score"
                      stroke="#2196f3"
                      fill="#2196f3"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Benchmark Comparison */}
        {esgResults.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('esg.benchmarks')}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Industry Average vs Your Score
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      Your Score:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={esgResults[0].benchmark_comparison.entity_score}
                      sx={{ flexGrow: 1, mx: 1 }}
                      color="primary"
                    />
                    <Typography variant="body2">
                      {esgResults[0].benchmark_comparison.entity_score}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      Industry Avg:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={esgResults[0].benchmark_comparison.industry_average}
                      sx={{ flexGrow: 1, mx: 1 }}
                      color="secondary"
                    />
                    <Typography variant="body2">
                      {esgResults[0].benchmark_comparison.industry_average}
                    </Typography>
                  </Box>
                </Box>
                
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Ranking:</strong> {esgResults[0].benchmark_comparison.ranking} 
                    ({esgResults[0].benchmark_comparison.percentile}th percentile)
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recommendations */}
        {esgResults.length > 0 && esgResults[0].recommendations.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('esg.recommendations')}
                </Typography>
                
                <List>
                  {esgResults[0].recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Lightbulb color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {recommendation.action}
                            </Typography>
                            <Chip
                              label={recommendation.priority}
                              size="small"
                              color={getPriorityColor(recommendation.priority)}
                            />
                          </Box>
                        }
                        secondary={recommendation.impact}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Detailed ESG Factors */}
        {esgResults.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('esg.factors')}
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Nature color="success" />
                      <Typography>Environmental Factors</Typography>
                      <Chip 
                        label={Math.round(esgResults[0].scores.environmental.score)} 
                        size="small" 
                        color={getScoreColor(esgResults[0].scores.environmental.score)}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(esgResults[0].scores.environmental.factors).map(([key, factor]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={factor.score}
                              color={getScoreColor(factor.score)}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Score: {Math.round(factor.score)} (Weight: {Math.round(factor.weight * 100)}%)
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People color="info" />
                      <Typography>Social Factors</Typography>
                      <Chip 
                        label={Math.round(esgResults[0].scores.social.score)} 
                        size="small" 
                        color={getScoreColor(esgResults[0].scores.social.score)}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(esgResults[0].scores.social.factors).map(([key, factor]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={factor.score}
                              color={getScoreColor(factor.score)}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Score: {Math.round(factor.score)} (Weight: {Math.round(factor.weight * 100)}%)
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessCenter color="warning" />
                      <Typography>Governance Factors</Typography>
                      <Chip 
                        label={Math.round(esgResults[0].scores.governance.score)} 
                        size="small" 
                        color={getScoreColor(esgResults[0].scores.governance.score)}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(esgResults[0].scores.governance.factors).map(([key, factor]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={factor.score}
                              color={getScoreColor(factor.score)}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Score: {Math.round(factor.score)} (Weight: {Math.round(factor.weight * 100)}%)
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ESGDashboard;