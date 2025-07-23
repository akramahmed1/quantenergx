# QuantEnergX Frontend

This is the frontend application for the QuantEnergX energy trading platform, built with Next.js 14, React, TypeScript, and Tailwind CSS.

## Features

- 🌍 **Multi-language support** (EN, AR, FR, ES) with RTL support for Arabic
- 🎨 **Modern UI** with Tailwind CSS and Radix UI components
- 📱 **Responsive design** that works on all devices
- ♿ **Accessibility first** with WCAG 2.1 compliance
- 🔒 **Security headers** and best practices
- 🧪 **Comprehensive testing** with Jest and React Testing Library
- 🚀 **Performance optimized** with Next.js 14 App Router

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── trading/        # Trading-specific components
│   ├── devices/        # IoT device components
│   └── analytics/      # Analytics components
├── i18n/               # Internationalization
│   ├── locales/        # Translation files
│   ├── routing.ts      # Routing configuration
│   └── request.ts      # i18n configuration
├── lib/                # Utility functions
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Internationalization

The app supports 4 languages:
- English (en) - Default
- Arabic (ar) - RTL support
- French (fr)
- Spanish (es)

Translation files are located in `src/i18n/locales/`.

## Components

### UI Components
- Built with Radix UI primitives
- Styled with Tailwind CSS
- Accessible by default
- Dark mode support

### Key Features
- **Dashboard**: Overview of portfolio and devices
- **Trading**: Positions, orders, and market data
- **Devices**: IoT device registry and monitoring
- **Analytics**: Performance metrics and reports

## Testing

- Unit tests with Jest
- Component tests with React Testing Library
- Coverage reporting
- Accessibility testing

## License

Copyright (c) 2025 QuantEnergX. All rights reserved.