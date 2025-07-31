export interface RegionalConfig {
  country: string;
  timezone: string;
  currency: string;
  taxRate: number;
  customsDuty: number;
  tradingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  holidays: string[];
  regulations: {
    maxOrderSize: number;
    marginRequirement: number;
    settlementDays: number;
  };
}

export const regionalConfigs: Record<string, RegionalConfig> = {
  US: {
    country: "United States",
    timezone: "America/New_York",
    currency: "USD",
    taxRate: 0.21,
    customsDuty: 0.035,
    tradingHours: {
      start: "09:30",
      end: "16:00",
      timezone: "America/New_York"
    },
    holidays: [
      "2024-01-01", // New Year's Day
      "2024-01-15", // Martin Luther King Jr. Day
      "2024-02-19", // Presidents' Day
      "2024-05-27", // Memorial Day
      "2024-06-19", // Juneteenth
      "2024-07-04", // Independence Day
      "2024-09-02", // Labor Day
      "2024-10-14", // Columbus Day
      "2024-11-11", // Veterans Day
      "2024-11-28", // Thanksgiving
      "2024-12-25"  // Christmas
    ],
    regulations: {
      maxOrderSize: 10000000,
      marginRequirement: 0.05,
      settlementDays: 2
    }
  },
  UK: {
    country: "United Kingdom",
    timezone: "Europe/London",
    currency: "GBP",
    taxRate: 0.19,
    customsDuty: 0.025,
    tradingHours: {
      start: "08:00",
      end: "16:30",
      timezone: "Europe/London"
    },
    holidays: [
      "2024-01-01", // New Year's Day
      "2024-03-29", // Good Friday
      "2024-04-01", // Easter Monday
      "2024-05-06", // Early May Bank Holiday
      "2024-05-27", // Spring Bank Holiday
      "2024-08-26", // Summer Bank Holiday
      "2024-12-25", // Christmas Day
      "2024-12-26"  // Boxing Day
    ],
    regulations: {
      maxOrderSize: 8000000,
      marginRequirement: 0.04,
      settlementDays: 1
    }
  },
  EU: {
    country: "European Union",
    timezone: "Europe/Frankfurt",
    currency: "EUR",
    taxRate: 0.22,
    customsDuty: 0.03,
    tradingHours: {
      start: "09:00",
      end: "17:30",
      timezone: "Europe/Frankfurt"
    },
    holidays: [
      "2024-01-01", // New Year's Day
      "2024-03-29", // Good Friday
      "2024-04-01", // Easter Monday
      "2024-05-01", // Labour Day
      "2024-05-09", // Ascension Day
      "2024-05-20", // Whit Monday
      "2024-12-25", // Christmas Day
      "2024-12-26"  // Boxing Day
    ],
    regulations: {
      maxOrderSize: 7500000,
      marginRequirement: 0.045,
      settlementDays: 1
    }
  },
  GY: {
    country: "Guyana",
    timezone: "America/Guyana",
    currency: "GYD",
    taxRate: 0.25,
    customsDuty: 0.15,
    tradingHours: {
      start: "09:00",
      end: "15:00",
      timezone: "America/Guyana"
    },
    holidays: [
      "2024-01-01", // New Year's Day
      "2024-02-23", // Republic Day
      "2024-03-29", // Good Friday
      "2024-04-01", // Easter Monday
      "2024-05-01", // Labour Day
      "2024-05-26", // Independence Day
      "2024-08-01", // Emancipation Day
      "2024-10-05", // Deepavali
      "2024-12-25", // Christmas Day
      "2024-12-26"  // Boxing Day
    ],
    regulations: {
      maxOrderSize: 5000000,
      marginRequirement: 0.1,
      settlementDays: 3
    }
  },
  ME: {
    country: "Middle East",
    timezone: "Asia/Dubai",
    currency: "AED",
    taxRate: 0.05,
    customsDuty: 0.05,
    tradingHours: {
      start: "10:00",
      end: "14:00",
      timezone: "Asia/Dubai"
    },
    holidays: [
      "2024-01-01", // New Year's Day
      "2024-04-09", // Eid al-Fitr (estimated)
      "2024-04-10", // Eid al-Fitr Holiday
      "2024-06-15", // Eid al-Adha (estimated)
      "2024-06-16", // Eid al-Adha Holiday
      "2024-07-07", // Islamic New Year (estimated)
      "2024-09-15", // Prophet's Birthday (estimated)
      "2024-12-02", // UAE National Day
      "2024-12-25"  // Christmas Day (for international traders)
    ],
    regulations: {
      maxOrderSize: 6000000,
      marginRequirement: 0.08,
      settlementDays: 2
    }
  }
};

export const getRegionalConfig = (region: string): RegionalConfig => {
  return regionalConfigs[region] || regionalConfigs.US;
};

export const isMarketOpen = (region: string): boolean => {
  const config = getRegionalConfig(region);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if today is a holiday
  if (config.holidays.includes(today)) {
    return false;
  }
  
  // Check if within trading hours
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;
  
  const [startHour, startMinute] = config.tradingHours.start.split(':').map(Number);
  const [endHour, endMinute] = config.tradingHours.end.split(':').map(Number);
  
  const startTime = startHour + startMinute / 60;
  const endTime = endHour + endMinute / 60;
  
  return currentTime >= startTime && currentTime <= endTime;
};