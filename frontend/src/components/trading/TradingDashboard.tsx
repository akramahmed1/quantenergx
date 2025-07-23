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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  status: 'filled' | 'pending' | 'cancelled';
  timestamp: string;
}

function PositionCard({ position }: { position: Position }) {
  const isProfit = position.unrealizedPnl > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{position.symbol}</CardTitle>
        <Badge variant={isProfit ? 'default' : 'destructive'}>
          {isProfit ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {isProfit ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-medium">{position.quantity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg. Price</p>
            <p className="font-medium">${position.averagePrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Price</p>
            <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Market Value</p>
            <p className="font-medium">${position.marketValue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Unrealized P&L</span>
            <span className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const t = useTranslations();
  
  const getStatusBadge = (status: Trade['status']) => {
    switch (status) {
      case 'filled':
        return <Badge variant="default" className="bg-green-500">Filled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
            {trade.side.toUpperCase()}
          </Badge>
          <span className="font-medium">{trade.symbol}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {trade.quantity} @ ${trade.price.toFixed(2)}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-medium">${trade.total.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{trade.timestamp}</div>
        </div>
        {getStatusBadge(trade.status)}
      </div>
    </div>
  );
}

export function TradingDashboard() {
  const t = useTranslations();

  // Mock data
  const positions: Position[] = [
    {
      id: '1',
      symbol: 'ENERGY_USD',
      quantity: 100,
      averagePrice: 50.00,
      currentPrice: 52.50,
      marketValue: 5250,
      unrealizedPnl: 250,
      unrealizedPnlPercent: 5.0,
      dayChange: 1.50,
      dayChangePercent: 2.94
    },
    {
      id: '2',
      symbol: 'SOLAR_USD',
      quantity: 200,
      averagePrice: 25.00,
      currentPrice: 24.20,
      marketValue: 4840,
      unrealizedPnl: -160,
      unrealizedPnlPercent: -3.2,
      dayChange: -0.80,
      dayChangePercent: -3.20
    },
    {
      id: '3',
      symbol: 'WIND_USD',
      quantity: 150,
      averagePrice: 30.00,
      currentPrice: 32.10,
      marketValue: 4815,
      unrealizedPnl: 315,
      unrealizedPnlPercent: 7.0,
      dayChange: 2.10,
      dayChangePercent: 7.00
    }
  ];

  const recentTrades: Trade[] = [
    {
      id: '1',
      symbol: 'ENERGY_USD',
      side: 'buy',
      quantity: 50,
      price: 52.00,
      total: 2600,
      status: 'filled',
      timestamp: '2 minutes ago'
    },
    {
      id: '2',
      symbol: 'SOLAR_USD',
      side: 'sell',
      quantity: 25,
      price: 24.50,
      total: 612.50,
      status: 'filled',
      timestamp: '15 minutes ago'
    },
    {
      id: '3',
      symbol: 'WIND_USD',
      side: 'buy',
      quantity: 75,
      price: 32.00,
      total: 2400,
      status: 'pending',
      timestamp: '1 hour ago'
    }
  ];

  const portfolioStats = {
    totalValue: 14905,
    dayChange: 405,
    dayChangePercent: 2.79,
    totalPnl: 405,
    totalPnlPercent: 2.79
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('common.trading')}</h2>
          <p className="text-muted-foreground">
            Monitor your trading positions and execute new orders.
          </p>
        </div>
        <Button>New Order</Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
            <p className={`text-xs ${portfolioStats.dayChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioStats.dayChange > 0 ? '+' : ''}${portfolioStats.dayChange.toFixed(2)} ({portfolioStats.dayChangePercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+${portfolioStats.totalPnl.toFixed(2)}</div>
            <p className="text-xs text-green-600">
              +{portfolioStats.totalPnlPercent.toFixed(2)}% overall
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buying Power</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$25,000</div>
            <p className="text-xs text-muted-foreground">Available to trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">{t('trading.open_positions')}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTrades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}