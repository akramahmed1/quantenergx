/*
 * Copyright (c) 2025 QuantEnergX. All rights reserved.
 * This software contains proprietary and confidential information.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * Patent Pending - Application filed under applicable jurisdictions.
 */

import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    return {
      locale: 'en',  // fallback to English
      messages: (await import(`./locales/en.json`)).default
    };
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});