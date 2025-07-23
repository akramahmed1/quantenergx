/*
 * Copyright (c) 2025 QuantEnergX. All rights reserved.
 * This software contains proprietary and confidential information.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * Patent Pending - Application filed under applicable jurisdictions.
 */

import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar', 'fr', 'es'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/dashboard': {
      en: '/dashboard',
      ar: '/لوحة-التحكم',
      fr: '/tableau-de-bord',
      es: '/panel-de-control'
    },
    '/trading': {
      en: '/trading',
      ar: '/التداول',
      fr: '/trading',
      es: '/trading'
    },
    '/portfolio': {
      en: '/portfolio',
      ar: '/المحفظة',
      fr: '/portefeuille',
      es: '/cartera'
    },
    '/devices': {
      en: '/devices',
      ar: '/الأجهزة',
      fr: '/appareils',
      es: '/dispositivos'
    },
    '/analytics': {
      en: '/analytics',
      ar: '/التحليلات',
      fr: '/analyses',
      es: '/analisis'
    },
    '/settings': {
      en: '/settings',
      ar: '/الإعدادات',
      fr: '/parametres',
      es: '/configuracion'
    }
  }
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createLocalizedPathnamesNavigation(routing);