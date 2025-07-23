/*
 * Copyright (c) 2025 QuantEnergX. All rights reserved.
 * This software contains proprietary and confidential information.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * Patent Pending - Application filed under applicable jurisdictions.
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Users } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, changeType, icon, description }: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    return changeType === 'positive' ? (
      <TrendingUp className="h-4 w-4" />
    ) : changeType === 'negative' ? (
      <TrendingDown className="h-4 w-4" />
    ) : null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${getChangeColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">{change}</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const t = useTranslations();

  // Mock data - in a real app, this would come from API
  const metrics = [
    {
      title: t('trading.portfolio_value'),
      value: '$45,231.89',
      change: '+20.1% from last month',
      changeType: 'positive' as const,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: 'Total portfolio value'
    },
    {
      title: t('trading.day_change'),
      value: '+$2,350.00',
      change: '+5.2% today',
      changeType: 'positive' as const,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      description: 'Daily P&L'
    },
    {
      title: t('devices.energy_consumption'),
      value: '2,450 kWh',
      change: '-12% from last month',
      changeType: 'positive' as const,
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      description: 'Monthly energy usage'
    },
    {
      title: t('trading.open_positions'),
      value: '12',
      change: '+2 new positions',
      changeType: 'neutral' as const,
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      description: 'Active trading positions'
    },
    {
      title: t('analytics.cost_savings'),
      value: '$8,420',
      change: '+15% this quarter',
      changeType: 'positive' as const,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: 'Total cost savings'
    },
    {
      title: 'Active Devices',
      value: '28',
      change: '2 offline',
      changeType: 'neutral' as const,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: 'Connected IoT devices'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('navigation.overview')}</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your energy trading and IoT devices today.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-green-50">Trade</Badge>
                <span className="text-sm">Bought 100 ENERGY_USD @ $52.00</span>
              </div>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-blue-50">Device</Badge>
                <span className="text-sm">Solar Panel Array came online</span>
              </div>
              <span className="text-xs text-muted-foreground">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-orange-50">Alert</Badge>
                <span className="text-sm">High energy consumption detected</span>
              </div>
              <span className="text-xs text-muted-foreground">15 minutes ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}