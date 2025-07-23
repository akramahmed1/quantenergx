/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { getEnergyWidgetStyles } from '../../utils/rtl';

interface AnalyticsData {
  timestamp: string;
  value: number;
  label?: string;
}

interface AnalyticsWidgetProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'metric';
  data: AnalyticsData[];
  loading?: boolean;
  error?: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  onRefresh?: () => void;
  height?: number;
  showTimeRange?: boolean;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  title,
  type,
  data,
  loading = false,
  error,
  unit = '',
  trend = 'neutral',
  onRefresh,
  height = 300,
  showTimeRange = true,
}) => {
  const { t } = useTranslation(['common', 'analytics', 'energy']);
  const { isRTL } = useLanguage();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [timeRange, setTimeRange] = useState('24h');

  const timeRanges = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  const colors = {
    primary: '#1976d2',
    secondary: '#388e3c',
    accent: '#f57c00',
    danger: '#d32f2f',
    success: '#2e7d32',
  };

  const pieColors = [colors.primary, colors.secondary, colors.accent, colors.danger, colors.success];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    handleMenuClose();
    // In a real app, this would trigger a data refresh
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <TimelineIcon color="action" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.danger;
      default:
        return 'text.secondary';
    }
  };

  const getCurrentValue = (): number => {
    return data.length > 0 ? data[data.length - 1].value : 0;
  };

  const getPreviousValue = (): number => {
    return data.length > 1 ? data[data.length - 2].value : 0;
  };

  const getTrendPercentage = (): number => {
    const current = getCurrentValue();
    const previous = getPreviousValue();
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: height - 100 
          }}
        >
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

    if (!data || data.length === 0) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: height - 100,
            color: 'text.secondary'
          }}
        >
          <Typography>No data available</Typography>
        </Box>
      );
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                formatter={(value: number) => [`${formatValue(value)} ${unit}`, title]}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors.primary} 
                strokeWidth={2}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip 
                formatter={(value: number) => [`${formatValue(value)} ${unit}`, title]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="value" fill={colors.secondary} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ label, value }) => `${label}: ${formatValue(value)}${unit}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${formatValue(value)} ${unit}`} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'metric':
        return (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: height - 100,
              ...getEnergyWidgetStyles(isRTL)
            }}
          >
            <Typography variant="h3" component="div" color="primary.main" fontWeight="bold">
              {formatValue(getCurrentValue())} {unit}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {getTrendIcon()}
              <Typography 
                variant="body1" 
                sx={{ ml: 1, color: getTrendColor() }}
              >
                {getTrendPercentage() > 0 ? '+' : ''}{getTrendPercentage().toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              vs previous period
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      sx={{ 
        height: height,
        display: 'flex',
        flexDirection: 'column',
        ...getEnergyWidgetStyles(isRTL)
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {type === 'metric' && (
              <Chip 
                label={trend} 
                size="small" 
                color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
              />
            )}
          </Box>
        }
        action={
          <Box>
            {onRefresh && (
              <IconButton onClick={onRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            )}
            {showTimeRange && (
              <>
                <IconButton onClick={handleMenuOpen} size="small">
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  {timeRanges.map((range) => (
                    <MenuItem
                      key={range.value}
                      onClick={() => handleTimeRangeChange(range.value)}
                      selected={timeRange === range.value}
                    >
                      {range.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;