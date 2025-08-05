/**
 * Marketplace Routes
 * Third-party plugin marketplace ecosystem routes
 */
const express = require('express');
const router = express.Router();
const _path = require('path');

// Import the enhanced plugin manager
let EnhancedPluginManager;
try {
  // Try to import the TypeScript module (requires compilation)
  EnhancedPluginManager = require('../plugins/enhancedPluginManager').default;
} catch (error) {
  // Fallback to JavaScript implementation
  EnhancedPluginManager = require('../services/marketplaceService');
}

// Initialize marketplace service
const marketplace = new EnhancedPluginManager();

/**
 * @route GET /api/v1/marketplace/plugins
 * @desc Get marketplace plugin listings
 * @access Public
 */
router.get('/plugins', async (req, res) => {
  try {
    const { category, featured, search, limit = 20, offset = 0 } = req.query;

    let listings;

    if (search) {
      listings = marketplace.searchMarketplace(search);
    } else {
      listings = marketplace.getMarketplaceListings(
        category,
        featured === 'true' ? true : featured === 'false' ? false : undefined
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedListings = listings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedListings,
      pagination: {
        total: listings.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: endIndex < listings.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get marketplace plugins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve marketplace plugins',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/v1/marketplace/plugins/:plugin_id
 * @desc Get detailed plugin information
 * @access Public
 */
router.get('/plugins/:plugin_id', async (req, res) => {
  try {
    const { plugin_id } = req.params;

    const marketplaceEntry = marketplace.marketplace?.get(plugin_id);
    const plugin = marketplace.plugins?.get(plugin_id);

    if (!marketplaceEntry || !plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found in marketplace',
      });
    }

    const detailedInfo = {
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        category: plugin.category,
        type: plugin.type,
        license: plugin.license,
        permissions: plugin.permissions,
        dependencies: plugin.dependencies,
        rating: plugin.rating,
        downloads: plugin.downloads,
        verified: plugin.verified,
      },
      marketplace: {
        publisher: marketplaceEntry.publisher,
        published_date: marketplaceEntry.published_date,
        marketplace_category: marketplaceEntry.marketplace_category,
        featured: marketplaceEntry.featured,
        screenshots: marketplaceEntry.screenshots,
        documentation_url: marketplaceEntry.documentation_url,
        support_url: marketplaceEntry.support_url,
        pricing_model: marketplaceEntry.pricing_model,
        pricing_details: marketplaceEntry.pricing_details,
        review_count: marketplaceEntry.reviews.length,
        average_rating:
          marketplaceEntry.reviews.length > 0
            ? marketplaceEntry.reviews.reduce((sum, r) => sum + r.rating, 0) /
              marketplaceEntry.reviews.length
            : 0,
      },
    };

    res.json({
      success: true,
      data: detailedInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get plugin details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plugin details',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/v1/marketplace/plugins/:plugin_id/install
 * @desc Install plugin from marketplace
 * @access Private
 */
router.post('/plugins/:plugin_id/install', async (req, res) => {
  try {
    const { plugin_id } = req.params;
    const { user_permissions = [] } = req.body;

    // Simulate user permission check (would come from auth middleware)
    const defaultPermissions = [
      'plugins:install',
      'risk:read',
      'risk:write',
      'analytics:read',
      'analytics:write',
      'compliance:read',
    ];

    const userPerms = user_permissions.length > 0 ? user_permissions : defaultPermissions;

    const success = await marketplace.installPlugin(plugin_id, userPerms);

    if (success) {
      res.json({
        success: true,
        data: {
          plugin_id: plugin_id,
          status: 'installed',
          install_date: new Date().toISOString(),
        },
        message: 'Plugin installed successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to install plugin',
      });
    }
  } catch (error) {
    console.error('Install plugin error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to install plugin',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/v1/marketplace/plugins/:plugin_id/reviews
 * @desc Get plugin reviews
 * @access Public
 */
router.get('/plugins/:plugin_id/reviews', async (req, res) => {
  try {
    const { plugin_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const reviews = marketplace.getPluginReviews ? marketplace.getPluginReviews(plugin_id) : [];

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = reviews.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedReviews,
      pagination: {
        total: reviews.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: endIndex < reviews.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get plugin reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plugin reviews',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/v1/marketplace/plugins/:plugin_id/reviews
 * @desc Add plugin review
 * @access Private
 */
router.post('/plugins/:plugin_id/reviews', async (req, res) => {
  try {
    const { plugin_id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be at least 10 characters long',
      });
    }

    const review = {
      user_id: req.user?.id || 'anonymous', // Would come from auth middleware
      rating: parseInt(rating),
      comment: comment.trim(),
      verified_purchase: true, // Would check actual purchase history
    };

    const success = marketplace.addPluginReview
      ? marketplace.addPluginReview(plugin_id, review)
      : false;

    if (success) {
      res.json({
        success: true,
        data: {
          ...review,
          date: new Date().toISOString(),
        },
        message: 'Review added successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to add review',
      });
    }
  } catch (error) {
    console.error('Add plugin review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/v1/marketplace/categories
 * @desc Get marketplace categories
 * @access Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'risk_management',
        name: 'Risk Management',
        description: 'Advanced risk modeling and analysis tools',
        plugin_count: 5,
        featured_plugins: ['weather-risk-analytics'],
      },
      {
        id: 'esg_sustainability',
        name: 'ESG & Sustainability',
        description: 'Environmental, Social, and Governance analytics',
        plugin_count: 3,
        featured_plugins: ['esg-scoring-engine'],
      },
      {
        id: 'trading_algorithms',
        name: 'Trading Algorithms',
        description: 'Automated trading strategies and execution algorithms',
        plugin_count: 8,
        featured_plugins: [],
      },
      {
        id: 'compliance_reporting',
        name: 'Compliance & Reporting',
        description: 'Regulatory compliance and automated reporting tools',
        plugin_count: 4,
        featured_plugins: [],
      },
      {
        id: 'market_data',
        name: 'Market Data & Analytics',
        description: 'Enhanced market data feeds and analytical tools',
        plugin_count: 6,
        featured_plugins: [],
      },
      {
        id: 'integration_apis',
        name: 'Integration & APIs',
        description: 'Third-party system integrations and API connectors',
        plugin_count: 7,
        featured_plugins: [],
      },
    ];

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/v1/marketplace/stats
 * @desc Get marketplace statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = marketplace.getPluginStatistics
      ? marketplace.getPluginStatistics()
      : {
          total_plugins: 0,
          by_status: {},
          by_type: {},
          by_category: {},
          marketplace_stats: {
            total_listings: 0,
            featured_count: 0,
            average_rating: 0,
          },
        };

    // Add additional marketplace metrics
    const marketplaceStats = {
      ...stats,
      growth_metrics: {
        new_plugins_this_month: 3,
        total_downloads: 15000,
        active_publishers: 25,
        user_satisfaction: 4.2,
      },
      trending_categories: ['ESG & Sustainability', 'Risk Management', 'Trading Algorithms'],
      recent_activity: {
        latest_plugin: 'weather-risk-analytics',
        latest_review_date: new Date().toISOString(),
        featured_this_week: 2,
      },
    };

    res.json({
      success: true,
      data: marketplaceStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve marketplace statistics',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/v1/marketplace/featured
 * @desc Get featured plugins
 * @access Public
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const featuredListings = marketplace.getMarketplaceListings
      ? marketplace.getMarketplaceListings(undefined, true)
      : [];

    const limitedListings = featuredListings.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedListings,
      count: limitedListings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get featured plugins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured plugins',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/v1/marketplace/search
 * @desc Advanced marketplace search
 * @access Public
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      category,
      price_range,
      rating_min,
      sort_by = 'relevance',
      limit = 20,
      offset = 0,
    } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
      });
    }

    let results = marketplace.searchMarketplace ? marketplace.searchMarketplace(query.trim()) : [];

    // Apply filters
    if (category) {
      results = results.filter(
        listing => listing.marketplace_category.toLowerCase() === category.toLowerCase()
      );
    }

    if (rating_min) {
      const minRating = parseFloat(rating_min);
      results = results.filter(listing => {
        const plugin = marketplace.plugins?.get(listing.plugin_id);
        return plugin && (plugin.rating || 0) >= minRating;
      });
    }

    if (price_range) {
      const [min, max] = price_range.split('-').map(p => parseFloat(p));
      results = results.filter(listing => {
        const plugin = marketplace.plugins?.get(listing.plugin_id);
        if (!plugin) return false;

        const price = plugin.price || 0;
        return price >= (min || 0) && price <= (max || Infinity);
      });
    }

    // Apply sorting
    switch (sort_by) {
      case 'rating':
        results.sort((a, b) => {
          const pluginA = marketplace.plugins?.get(a.plugin_id);
          const pluginB = marketplace.plugins?.get(b.plugin_id);
          return (pluginB?.rating || 0) - (pluginA?.rating || 0);
        });
        break;
      case 'downloads':
        results.sort((a, b) => {
          const pluginA = marketplace.plugins?.get(a.plugin_id);
          const pluginB = marketplace.plugins?.get(b.plugin_id);
          return (pluginB?.downloads || 0) - (pluginA?.downloads || 0);
        });
        break;
      case 'newest':
        results.sort((a, b) => b.published_date.getTime() - a.published_date.getTime());
        break;
      case 'price_low':
        results.sort((a, b) => {
          const pluginA = marketplace.plugins?.get(a.plugin_id);
          const pluginB = marketplace.plugins?.get(b.plugin_id);
          return (pluginA?.price || 0) - (pluginB?.price || 0);
        });
        break;
      default: // relevance
        // Results are already sorted by relevance from search
        break;
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedResults,
      search_info: {
        query: query.trim(),
        total_results: results.length,
        filters_applied: {
          category: category || null,
          price_range: price_range || null,
          rating_min: rating_min || null,
        },
        sort_by: sort_by,
      },
      pagination: {
        total: results.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: endIndex < results.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketplace search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search marketplace',
      details: error.message,
    });
  }
});

module.exports = router;
