import { EventEmitter } from 'events';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: 'risk' | 'analytics' | 'compliance' | 'trading' | 'data' | 'integration';
  type: 'internal' | 'third_party';
  price?: number;
  license: 'free' | 'paid' | 'subscription';
  dependencies: string[];
  permissions: string[];
  api_version: string;
  manifest: PluginManifest;
  status: 'installed' | 'active' | 'disabled' | 'error';
  install_date: Date;
  last_updated: Date;
  rating?: number;
  downloads?: number;
  verified: boolean;
}

interface PluginManifest {
  entry_point: string;
  config_schema: object;
  endpoints: PluginEndpoint[];
  hooks: string[];
  resources: PluginResource[];
  security_requirements: string[];
}

interface PluginEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  auth_required: boolean;
  permissions: string[];
}

interface PluginResource {
  type: 'database' | 'file_storage' | 'external_api' | 'queue';
  name: string;
  configuration: object;
}

interface MarketplaceEntry {
  plugin_id: string;
  publisher: string;
  published_date: Date;
  marketplace_category: string;
  featured: boolean;
  reviews: PluginReview[];
  screenshots: string[];
  documentation_url: string;
  support_url: string;
  pricing_model: 'free' | 'one_time' | 'subscription' | 'usage_based';
  pricing_details: object;
}

interface PluginReview {
  user_id: string;
  rating: number;
  comment: string;
  date: Date;
  verified_purchase: boolean;
}

class EnhancedPluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map();
  private marketplace: Map<string, MarketplaceEntry> = new Map();
  private activeHooks: Map<string, Function[]> = new Map();
  private pluginInstances: Map<string, any> = new Map();
  private securityValidator: PluginSecurityValidator;
  private marketplaceAPI: MarketplaceAPI;

  constructor() {
    super();
    this.securityValidator = new PluginSecurityValidator();
    this.marketplaceAPI = new MarketplaceAPI();
    this.initializeBuiltinPlugins();
    this.initializeMarketplace();
  }

  /**
   * Initialize built-in plugins
   */
  private initializeBuiltinPlugins(): void {
    const builtinPlugins: Plugin[] = [
      {
        id: 'risk-models-enhanced',
        name: 'Enhanced Risk Models',
        version: '2.0.0',
        description: 'Advanced risk modeling with Monte Carlo simulations',
        author: 'QuantEnergx Core Team',
        category: 'risk',
        type: 'internal',
        license: 'free',
        dependencies: [],
        permissions: ['risk:read', 'risk:write', 'market:read'],
        api_version: '2.0',
        manifest: {
          entry_point: 'risk-models/index.js',
          config_schema: {},
          endpoints: [
            {
              path: '/risk/monte-carlo',
              method: 'POST',
              description: 'Run Monte Carlo risk simulation',
              auth_required: true,
              permissions: ['risk:execute'],
            },
          ],
          hooks: ['portfolio:update', 'market:price_change'],
          resources: [],
          security_requirements: ['encrypted_storage'],
        },
        status: 'active',
        install_date: new Date(),
        last_updated: new Date(),
        verified: true,
      },
      {
        id: 'compliance-monitor-pro',
        name: 'Professional Compliance Monitor',
        version: '1.5.0',
        description: 'Real-time compliance monitoring with AI detection',
        author: 'QuantEnergx Core Team',
        category: 'compliance',
        type: 'internal',
        license: 'free',
        dependencies: [],
        permissions: ['compliance:read', 'compliance:write', 'audit:read'],
        api_version: '2.0',
        manifest: {
          entry_point: 'compliance/monitor.js',
          config_schema: {},
          endpoints: [
            {
              path: '/compliance/monitor',
              method: 'GET',
              description: 'Get compliance monitoring status',
              auth_required: true,
              permissions: ['compliance:read'],
            },
          ],
          hooks: ['trade:executed', 'user:action'],
          resources: [
            {
              type: 'database',
              name: 'compliance_logs',
              configuration: { encrypted: true },
            },
          ],
          security_requirements: ['audit_trail', 'encryption'],
        },
        status: 'active',
        install_date: new Date(),
        last_updated: new Date(),
        verified: true,
      },
    ];

    builtinPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  /**
   * Initialize marketplace with sample third-party plugins
   */
  private initializeMarketplace(): void {
    const marketplaceEntries: MarketplaceEntry[] = [
      {
        plugin_id: 'weather-risk-analytics',
        publisher: 'WeatherTech Solutions',
        published_date: new Date('2024-01-15'),
        marketplace_category: 'Risk Management',
        featured: true,
        reviews: [
          {
            user_id: 'user123',
            rating: 5,
            comment: 'Excellent weather risk integration',
            date: new Date('2024-07-15'),
            verified_purchase: true,
          },
        ],
        screenshots: ['/screenshots/weather-risk-1.png'],
        documentation_url: 'https://weathertech.com/docs/risk-analytics',
        support_url: 'https://weathertech.com/support',
        pricing_model: 'subscription',
        pricing_details: {
          monthly: 299,
          annual: 2990,
          currency: 'USD',
        },
      },
      {
        plugin_id: 'esg-scoring-engine',
        publisher: 'Green Analytics Inc',
        published_date: new Date('2024-02-20'),
        marketplace_category: 'ESG & Sustainability',
        featured: true,
        reviews: [],
        screenshots: ['/screenshots/esg-1.png', '/screenshots/esg-2.png'],
        documentation_url: 'https://greenanalytics.com/esg-docs',
        support_url: 'https://greenanalytics.com/support',
        pricing_model: 'usage_based',
        pricing_details: {
          per_calculation: 0.5,
          monthly_cap: 500,
          currency: 'USD',
        },
      },
    ];

    marketplaceEntries.forEach(entry => {
      this.marketplace.set(entry.plugin_id, entry);
    });

    // Add corresponding plugins
    const thirdPartyPlugins: Plugin[] = [
      {
        id: 'weather-risk-analytics',
        name: 'Weather Risk Analytics',
        version: '3.2.1',
        description: 'Advanced weather-based risk modeling for energy commodities',
        author: 'WeatherTech Solutions',
        category: 'risk',
        type: 'third_party',
        price: 299,
        license: 'subscription',
        dependencies: ['risk-models-enhanced'],
        permissions: ['risk:read', 'risk:write', 'external:weather_data'],
        api_version: '2.0',
        manifest: {
          entry_point: 'weather-risk/index.js',
          config_schema: {
            api_key: 'string',
            regions: 'array',
            update_frequency: 'number',
          },
          endpoints: [
            {
              path: '/weather/risk-assessment',
              method: 'POST',
              description: 'Assess weather-related risks',
              auth_required: true,
              permissions: ['risk:weather_analysis'],
            },
          ],
          hooks: ['weather:forecast_update', 'portfolio:risk_calculation'],
          resources: [
            {
              type: 'external_api',
              name: 'weather_service',
              configuration: { provider: 'WeatherTech' },
            },
          ],
          security_requirements: ['api_key_encryption', 'rate_limiting'],
        },
        status: 'installed',
        install_date: new Date(),
        last_updated: new Date(),
        rating: 4.8,
        downloads: 1250,
        verified: true,
      },
      {
        id: 'esg-scoring-engine',
        name: 'ESG Scoring Engine',
        version: '2.1.0',
        description: 'Comprehensive ESG scoring and sustainability analytics',
        author: 'Green Analytics Inc',
        category: 'analytics',
        type: 'third_party',
        price: 0,
        license: 'paid',
        dependencies: [],
        permissions: ['esg:read', 'esg:write', 'analytics:generate'],
        api_version: '2.0',
        manifest: {
          entry_point: 'esg-scoring/index.js',
          config_schema: {
            scoring_model: 'string',
            weight_preferences: 'object',
          },
          endpoints: [
            {
              path: '/esg/score',
              method: 'POST',
              description: 'Calculate ESG scores',
              auth_required: true,
              permissions: ['esg:calculate'],
            },
          ],
          hooks: ['portfolio:esg_update', 'sustainability:report_generation'],
          resources: [],
          security_requirements: ['data_privacy', 'audit_trail'],
        },
        status: 'disabled',
        install_date: new Date(),
        last_updated: new Date(),
        rating: 4.5,
        downloads: 890,
        verified: true,
      },
    ];

    thirdPartyPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  /**
   * Install plugin from marketplace
   */
  async installPlugin(pluginId: string, userPermissions: string[]): Promise<boolean> {
    try {
      const marketplaceEntry = this.marketplace.get(pluginId);
      if (!marketplaceEntry) {
        throw new Error(`Plugin ${pluginId} not found in marketplace`);
      }

      // Download plugin from marketplace
      const pluginData = await this.marketplaceAPI.downloadPlugin(pluginId);

      // Validate plugin security
      const securityCheck = await this.securityValidator.validatePlugin(pluginData);
      if (!securityCheck.safe) {
        throw new Error(`Security validation failed: ${securityCheck.issues.join(', ')}`);
      }

      // Check permissions
      const permissionCheck = this.validatePermissions(pluginData.permissions, userPermissions);
      if (!permissionCheck) {
        throw new Error('Insufficient permissions to install plugin');
      }

      // Install dependencies
      for (const depId of pluginData.dependencies) {
        if (!this.plugins.has(depId)) {
          await this.installPlugin(depId, userPermissions);
        }
      }

      // Create plugin entry
      const plugin: Plugin = {
        ...pluginData,
        status: 'installed',
        install_date: new Date(),
        last_updated: new Date(),
      };

      this.plugins.set(pluginId, plugin);

      this.emit('plugin:installed', { pluginId, plugin });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('plugin:install_failed', { pluginId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get marketplace listings
   */
  getMarketplaceListings(category?: string, featured?: boolean): MarketplaceEntry[] {
    let listings = Array.from(this.marketplace.values());

    if (category) {
      listings = listings.filter(entry => entry.marketplace_category === category);
    }

    if (featured !== undefined) {
      listings = listings.filter(entry => entry.featured === featured);
    }

    return listings.sort((a, b) => b.published_date.getTime() - a.published_date.getTime());
  }

  /**
   * Search marketplace
   */
  searchMarketplace(query: string): MarketplaceEntry[] {
    const results = Array.from(this.marketplace.values()).filter(entry => {
      const plugin = this.plugins.get(entry.plugin_id);
      if (!plugin) return false;

      const searchText =
        `${plugin.name} ${plugin.description} ${entry.marketplace_category}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    return results;
  }

  /**
   * Get plugin statistics
   */
  getPluginStatistics(): any {
    const plugins = Array.from(this.plugins.values());

    return {
      total_plugins: plugins.length,
      by_status: {
        active: plugins.filter(p => p.status === 'active').length,
        installed: plugins.filter(p => p.status === 'installed').length,
        disabled: plugins.filter(p => p.status === 'disabled').length,
        error: plugins.filter(p => p.status === 'error').length,
      },
      by_type: {
        internal: plugins.filter(p => p.type === 'internal').length,
        third_party: plugins.filter(p => p.type === 'third_party').length,
      },
      by_category: plugins.reduce(
        (acc, plugin) => {
          acc[plugin.category] = (acc[plugin.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      marketplace_stats: {
        total_listings: this.marketplace.size,
        featured_count: Array.from(this.marketplace.values()).filter(e => e.featured).length,
        average_rating: this.calculateAverageMarketplaceRating(),
      },
    };
  }

  // Private helper methods
  private validatePermissions(required: string[], available: string[]): boolean {
    return required.every(permission => available.includes(permission));
  }

  private calculateAverageMarketplaceRating(): number {
    const allReviews = Array.from(this.marketplace.values()).flatMap(entry => entry.reviews);

    if (allReviews.length === 0) return 0;

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / allReviews.length) * 10) / 10;
  }
}

/**
 * Plugin Security Validator
 */
class PluginSecurityValidator {
  async validatePlugin(pluginData: any): Promise<{ safe: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check for malicious patterns
    if (this.containsMaliciousCode(pluginData)) {
      issues.push('Potentially malicious code detected');
    }

    // Validate permissions
    if (this.hasExcessivePermissions(pluginData.permissions)) {
      issues.push('Plugin requests excessive permissions');
    }

    // Check dependencies
    if (this.hasUntrustedDependencies(pluginData.dependencies)) {
      issues.push('Plugin has untrusted dependencies');
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }

  private containsMaliciousCode(pluginData: any): boolean {
    // Simplified malicious code detection
    const maliciousPatterns = ['eval(', 'exec(', 'require("child_process")'];
    const codeString = JSON.stringify(pluginData);

    return maliciousPatterns.some(pattern => codeString.includes(pattern));
  }

  private hasExcessivePermissions(permissions: string[]): boolean {
    const dangerousPermissions = ['system:admin', 'file:write_all', 'network:unrestricted'];
    return permissions.some(perm => dangerousPermissions.includes(perm));
  }

  private hasUntrustedDependencies(dependencies: string[]): boolean {
    // Check against known trusted plugins list
    const trustedPlugins = ['risk-models-enhanced', 'compliance-monitor-pro'];
    return dependencies.some(dep => !trustedPlugins.includes(dep));
  }
}

/**
 * Marketplace API Client
 */
class MarketplaceAPI {
  async downloadPlugin(pluginId: string): Promise<any> {
    // Simulate downloading plugin from marketplace
    return {
      id: pluginId,
      name: `Plugin ${pluginId}`,
      version: '1.0.0',
      description: 'Downloaded from marketplace',
      author: 'Third Party Developer',
      category: 'analytics',
      type: 'third_party',
      license: 'paid',
      dependencies: [],
      permissions: ['analytics:read'],
      api_version: '2.0',
      manifest: {
        entry_point: 'index.js',
        config_schema: {},
        endpoints: [],
        hooks: [],
        resources: [],
        security_requirements: [],
      },
    };
  }
}

export default EnhancedPluginManager;
