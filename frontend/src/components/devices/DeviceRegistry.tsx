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
import { Zap, Wifi, AlertTriangle, Settings } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
  lastSeen: string;
  energyData?: {
    consumption: number;
    generation?: number;
  };
}

interface DeviceCardProps {
  device: Device;
  onViewDetails: (deviceId: string) => void;
  onToggleStatus: (deviceId: string) => void;
}

function DeviceCard({ device, onViewDetails, onToggleStatus }: DeviceCardProps) {
  const t = useTranslations();

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">
          <Wifi className="w-3 h-3 mr-1" />
          {t('devices.online')}
        </Badge>;
      case 'offline':
        return <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('devices.offline')}
        </Badge>;
      case 'maintenance':
        return <Badge variant="secondary">
          <Settings className="w-3 h-3 mr-1" />
          {t('devices.maintenance')}
        </Badge>;
      default:
        return null;
    }
  };

  const getDeviceIcon = (type: string) => {
    // Return appropriate icon based on device type
    return <Zap className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {getDeviceIcon(device.type)}
          <CardTitle className="text-lg">{device.name}</CardTitle>
        </div>
        {getStatusBadge(device.status)}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('devices.device_type')}:</span>
            <span className="capitalize">{device.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('devices.location')}:</span>
            <span>{device.location}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('devices.last_seen')}:</span>
            <span>{device.lastSeen}</span>
          </div>
        </div>

        {device.energyData && (
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('devices.energy_consumption')}:</span>
                <span className="font-medium">{device.energyData.consumption} kWh</span>
              </div>
              {device.energyData.generation && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('devices.power_generation')}:</span>
                  <span className="font-medium text-green-600">
                    +{device.energyData.generation} kWh
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(device.id)}
          >
            {t('common.view')} {t('common.details')}
          </Button>
          <Button
            variant={device.status === 'online' ? 'secondary' : 'default'}
            size="sm"
            onClick={() => onToggleStatus(device.id)}
          >
            {device.status === 'online' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeviceRegistry() {
  const t = useTranslations();

  // Mock device data
  const devices: Device[] = [
    {
      id: '1',
      name: 'Main Energy Meter',
      type: 'energy_meter',
      status: 'online',
      location: 'Building A - Main Panel',
      lastSeen: '2 minutes ago',
      energyData: { consumption: 1250 }
    },
    {
      id: '2',
      name: 'Solar Panel Array',
      type: 'solar_panel',
      status: 'online',
      location: 'Rooftop - South Wing',
      lastSeen: '1 minute ago',
      energyData: { consumption: 0, generation: 850 }
    },
    {
      id: '3',
      name: 'Wind Turbine #1',
      type: 'wind_turbine',
      status: 'maintenance',
      location: 'Field Area - North',
      lastSeen: '2 hours ago',
      energyData: { consumption: 50, generation: 0 }
    },
    {
      id: '4',
      name: 'Battery Storage Unit',
      type: 'battery',
      status: 'online',
      location: 'Storage Room B',
      lastSeen: '30 seconds ago',
      energyData: { consumption: 0 }
    }
  ];

  const handleViewDetails = (deviceId: string) => {
    console.log('View details for device:', deviceId);
    // Navigate to device details page
  };

  const handleToggleStatus = (deviceId: string) => {
    console.log('Toggle status for device:', deviceId);
    // Toggle device status
  };

  const handleRegisterDevice = () => {
    console.log('Register new device');
    // Open device registration modal
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('navigation.device_registry')}</h2>
          <p className="text-muted-foreground">
            Manage and monitor your IoT devices and energy systems.
          </p>
        </div>
        <Button onClick={handleRegisterDevice}>
          {t('devices.register_device')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onViewDetails={handleViewDetails}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {/* Device Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Device Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {devices.filter(d => d.status === 'online').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('devices.online')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {devices.filter(d => d.status === 'offline').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('devices.offline')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {devices.filter(d => d.status === 'maintenance').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('devices.maintenance')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}