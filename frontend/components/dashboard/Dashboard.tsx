/*
QuantEnergX MVP - Main Dashboard Component
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

Comprehensive energy trading dashboard with real-time analytics,
multi-language support, and responsive design for enterprise users.
*/

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'next-i18next';
import {
  ChartBarIcon,
  BoltIcon,
  CpuChipIcon,
  BellIcon,
  UserCircleIcon,
  CogIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalPortfolioValue: number;
  dailyPnL: number;
  activePositions: number;
  connectedDevices: number;
  energyConsumption: number;
  riskScore: number;
}

interface RecentActivity {
  id: string;
  type: 'trade' | 'alert' | 'device' | 'analytics';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // Mock data loading - in production would fetch from API
    const loadDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStats: DashboardStats = {
          totalPortfolioValue: 2456789.50,
          dailyPnL: 12450.75,
          activePositions: 15,
          connectedDevices: 247,
          energyConsumption: 1847.23,
          riskScore: 0.23
        };

        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'trade',
            title: t('dashboard.activity.tradeExecuted'),
            description: 'ELEC Buy 1000 MW @ $105.50',
            timestamp: '2025-01-01T10:30:00Z',
            status: 'success'
          },
          {
            id: '2',
            type: 'alert',
            title: t('dashboard.activity.riskAlert'),
            description: 'Portfolio risk threshold exceeded',
            timestamp: '2025-01-01T09:45:00Z',
            status: 'warning'
          },
          {
            id: '3',
            type: 'device',
            title: t('dashboard.activity.deviceConnected'),
            description: 'Solar Panel Array #23 came online',
            timestamp: '2025-01-01T09:15:00Z',
            status: 'info'
          },
          {
            id: '4',
            type: 'analytics',
            title: t('dashboard.activity.reportGenerated'),
            description: 'Daily performance report completed',
            timestamp: '2025-01-01T08:00:00Z',
            status: 'success'
          }
        ];

        setStats(mockStats);
        setRecentActivity(mockActivity);
      } catch (error) {
        console.error('Dashboard data loading error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [t]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(i18n.language).format(num);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <ChartBarIcon className="h-5 w-5" />;
      case 'alert':
        return <BellIcon className="h-5 w-5" />;
      case 'device':
        return <CpuChipIcon className="h-5 w-5" />;
      case 'analytics':
        return <EyeIcon className="h-5 w-5" />;
      default:
        return <BoltIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('dashboard.title')}
                </h1>
                <p className="text-sm text-gray-500">
                  {t('dashboard.welcome', { name: user?.full_name })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
                <BellIcon className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
                <CogIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm font-medium text-gray-700`}>
                  {user?.full_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Portfolio Value */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                <p className="text-sm font-medium text-gray-500">
                  {t('dashboard.stats.portfolioValue')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? formatCurrency(stats.totalPortfolioValue) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Daily P&L */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {stats && stats.dailyPnL >= 0 ? (
                  <ArrowUpIcon className="h-8 w-8 text-green-600" />
                ) : (
                  <ArrowDownIcon className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                <p className="text-sm font-medium text-gray-500">
                  {t('dashboard.stats.dailyPnL')}
                </p>
                <p className={`text-2xl font-semibold ${
                  stats && stats.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats ? formatCurrency(stats.dailyPnL) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Positions */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BoltIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                <p className="text-sm font-medium text-gray-500">
                  {t('dashboard.stats.activePositions')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? formatNumber(stats.activePositions) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                <p className="text-sm font-medium text-gray-500">
                  {t('dashboard.stats.connectedDevices')}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? formatNumber(stats.connectedDevices) : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-soft">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('dashboard.recentActivity')}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 rounded-full p-2 ${getStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Intl.DateTimeFormat(i18n.language, {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          }).format(new Date(activity.timestamp))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Energy Consumption */}
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t('dashboard.energyConsumption')}
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">
                  {stats ? formatNumber(stats.energyConsumption) : '--'}
                </div>
                <div className="text-sm text-gray-500">MWh</div>
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-white rounded-lg shadow-soft p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {t('dashboard.riskScore')}
              </h4>
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  stats && stats.riskScore > 0.7 ? 'text-red-600' : 
                  stats && stats.riskScore > 0.4 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {stats ? (stats.riskScore * 100).toFixed(1) : '--'}%
                </div>
                <div className="text-sm text-gray-500">
                  {stats && stats.riskScore > 0.7 ? t('dashboard.risk.high') : 
                   stats && stats.riskScore > 0.4 ? t('dashboard.risk.medium') : t('dashboard.risk.low')}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {hasPermission('trading:execute') && (
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {t('dashboard.quickActions')}
                </h4>
                <div className="space-y-3">
                  <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    {t('dashboard.actions.newTrade')}
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                    {t('dashboard.actions.viewPortfolio')}
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                    {t('dashboard.actions.generateReport')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;