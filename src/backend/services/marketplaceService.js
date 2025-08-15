/**
 * Marketplace Service
 * Fallback JavaScript implementation for marketplace functionality
 */
class MarketplaceService {
  constructor() {
    this.plugins = new Map();
    this.marketplace = new Map();
    this.initializeData();
  }

  initializeData() {
    // Initialize sample plugins
    const samplePlugins = [
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
        dependencies: [],
        permissions: ['risk:read', 'risk:write'],
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
        permissions: ['esg:read', 'esg:write'],
        rating: 4.5,
        downloads: 890,
        verified: true,
      },
    ];

    samplePlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });

    // Initialize marketplace entries
    const marketplaceEntries = [
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
        screenshots: ['/screenshots/esg-1.png'],
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
  }

  getMarketplaceListings(category, featured) {
    let listings = Array.from(this.marketplace.values());

    if (category) {
      listings = listings.filter(entry => entry.marketplace_category === category);
    }

    if (featured !== undefined) {
      listings = listings.filter(entry => entry.featured === featured);
    }

    return listings.sort((a, b) => b.published_date.getTime() - a.published_date.getTime());
  }

  searchMarketplace(query) {
    const results = Array.from(this.marketplace.values()).filter(entry => {
      const plugin = this.plugins.get(entry.plugin_id);
      if (!plugin) return false;

      const searchText =
        `${plugin.name} ${plugin.description} ${entry.marketplace_category}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    return results;
  }

  getPluginReviews(pluginId) {
    const marketplaceEntry = this.marketplace.get(pluginId);
    return marketplaceEntry ? marketplaceEntry.reviews : [];
  }

  addPluginReview(pluginId, review) {
    const marketplaceEntry = this.marketplace.get(pluginId);
    if (!marketplaceEntry) {
      return false;
    }

    const fullReview = {
      ...review,
      date: new Date(),
    };

    marketplaceEntry.reviews.push(fullReview);

    // Update plugin rating
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      const avgRating =
        marketplaceEntry.reviews.reduce((sum, r) => sum + r.rating, 0) /
        marketplaceEntry.reviews.length;
      plugin.rating = Math.round(avgRating * 10) / 10;
    }

    return true;
  }

  async installPlugin(pluginId, userPermissions) {
    const marketplaceEntry = this.marketplace.get(pluginId);
    if (!marketplaceEntry) {
      throw new Error(`Plugin ${pluginId} not found in marketplace`);
    }

    // Simulate installation
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.status = 'installed';
      plugin.install_date = new Date();
      return true;
    }

    return false;
  }

  getPluginStatistics() {
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
      by_category: plugins.reduce((acc, plugin) => {
        acc[plugin.category] = (acc[plugin.category] || 0) + 1;
        return acc;
      }, {}),
      marketplace_stats: {
        total_listings: this.marketplace.size,
        featured_count: Array.from(this.marketplace.values()).filter(e => e.featured).length,
        average_rating: this.calculateAverageMarketplaceRating(),
      },
    };
  }

  calculateAverageMarketplaceRating() {
    const allReviews = Array.from(this.marketplace.values()).flatMap(entry => entry.reviews);

    if (allReviews.length === 0) return 0;

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / allReviews.length) * 10) / 10;
  }
}

module.exports = MarketplaceService;
