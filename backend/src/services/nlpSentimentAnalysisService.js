/**
 * NLP News Sentiment Analysis Service
 * Analyzes news sentiment for energy markets using natural language processing
 */
class NLPSentimentAnalysisService {
  constructor() {
    this.sentimentCache = new Map();
    this.newsCache = new Map();
    this.sentimentHistory = [];
    this.keywords = {
      oil: ['crude oil', 'petroleum', 'WTI', 'Brent', 'OPEC', 'refinery', 'drilling'],
      gas: ['natural gas', 'LNG', 'pipeline', 'shale', 'fracking', 'Henry Hub'],
      renewable: ['solar', 'wind', 'renewable', 'clean energy', 'green', 'ESG', 'carbon'],
      geopolitical: ['sanctions', 'war', 'conflict', 'embargo', 'trade war', 'tariff'],
      economic: ['recession', 'inflation', 'GDP', 'demand', 'supply', 'inventory'],
    };
    this.sources = [
      'Reuters Energy',
      'Bloomberg Energy',
      'S&P Global Platts',
      'Energy Intelligence',
      'Wall Street Journal',
      'Financial Times',
    ];
  }

  /**
   * Analyze sentiment from multiple news sources
   */
  async analyzeSentiment(timeframe = '24h', commodities = ['oil', 'gas', 'renewable']) {
    try {
      const newsData = await this.fetchNewsData(timeframe, commodities);
      const analysis = await this.processNewsArticles(newsData);

      const result = {
        analysis_id: this.generateAnalysisId(),
        timestamp: new Date().toISOString(),
        timeframe: timeframe,
        commodities: commodities,
        overall_sentiment: analysis.overall,
        commodity_sentiment: analysis.by_commodity,
        key_themes: analysis.themes,
        sentiment_trend: analysis.trend,
        news_volume: newsData.length,
        confidence_score: analysis.confidence,
        alerts: analysis.alerts,
        recommendations: analysis.recommendations,
      };

      this.sentimentCache.set(result.analysis_id, result);
      this.updateSentimentHistory(result);

      return result;
    } catch (error) {
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Fetch news data from various sources
   */
  async fetchNewsData(timeframe, commodities) {
    // Simulate fetching news data from multiple sources
    const articles = [];
    const articlesPerSource = this.getArticleCount(timeframe);

    for (const source of this.sources) {
      for (let i = 0; i < articlesPerSource; i++) {
        const article = this.generateSimulatedArticle(source, commodities);
        articles.push(article);
      }
    }

    // Sort by publication time (most recent first)
    return articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }

  /**
   * Process news articles to extract sentiment
   */
  async processNewsArticles(articles) {
    const sentimentScores = [];
    const commodityScores = { oil: [], gas: [], renewable: [] };
    const themes = new Map();
    const alerts = [];

    for (const article of articles) {
      const articleSentiment = await this.analyzeArticleSentiment(article);
      sentimentScores.push(articleSentiment.overall_score);

      // Categorize by commodity
      for (const [commodity, score] of Object.entries(articleSentiment.commodity_scores)) {
        if (commodityScores[commodity]) {
          commodityScores[commodity].push(score);
        }
      }

      // Extract themes
      articleSentiment.themes.forEach(theme => {
        themes.set(theme, (themes.get(theme) || 0) + 1);
      });

      // Check for alerts
      if (Math.abs(articleSentiment.overall_score) > 0.7) {
        alerts.push({
          type: articleSentiment.overall_score > 0 ? 'POSITIVE_NEWS' : 'NEGATIVE_NEWS',
          article_title: article.title,
          sentiment_score: articleSentiment.overall_score,
          source: article.source,
          published_at: article.published_at,
        });
      }
    }

    const overall = this.calculateOverallSentiment(sentimentScores);
    const byCommodity = this.calculateCommoditySentiments(commodityScores);
    const trend = await this.calculateSentimentTrend(overall);
    const confidence = this.calculateConfidence(sentimentScores.length, overall);

    return {
      overall,
      by_commodity: byCommodity,
      themes: this.getTopThemes(themes, 10),
      trend,
      confidence,
      alerts: alerts.slice(0, 5), // Top 5 alerts
      recommendations: this.generateRecommendations(overall, byCommodity, alerts),
    };
  }

  /**
   * Analyze sentiment of individual article
   */
  async analyzeArticleSentiment(article) {
    const text = `${article.title} ${article.summary}`;

    // Simulate NLP processing
    const overallScore = this.simulateNLPSentiment(text);
    const commodityScores = this.analyzeCommoditySpecificSentiment(text);
    const themes = this.extractThemes(text);
    const entities = this.extractEntities(text);

    return {
      overall_score: overallScore,
      commodity_scores: commodityScores,
      themes: themes,
      entities: entities,
      text_length: text.length,
      processing_confidence: this.calculateTextConfidence(text),
    };
  }

  /**
   * Simulate NLP sentiment analysis
   */
  simulateNLPSentiment(text) {
    const positiveWords = [
      'surge',
      'rise',
      'increase',
      'bullish',
      'growth',
      'strong',
      'gains',
      'optimistic',
    ];
    const negativeWords = [
      'fall',
      'decline',
      'drop',
      'bearish',
      'weak',
      'concerns',
      'crisis',
      'crash',
    ];

    let score = 0;
    const words = text.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) score += 0.1;
      if (negativeWords.some(nw => word.includes(nw))) score -= 0.1;
    });

    // Add some random variation
    score += (Math.random() - 0.5) * 0.2;

    // Normalize to [-1, 1]
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Analyze commodity-specific sentiment
   */
  analyzeCommoditySpecificSentiment(text) {
    const scores = {};

    for (const [commodity, keywords] of Object.entries(this.keywords)) {
      let commodityScore = 0;
      let keywordCount = 0;

      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          keywordCount++;
          // Context-aware scoring
          const context = this.getKeywordContext(text, keyword);
          commodityScore += this.simulateNLPSentiment(context);
        }
      });

      if (keywordCount > 0) {
        scores[commodity] = commodityScore / keywordCount;
      } else {
        scores[commodity] = 0;
      }
    }

    return scores;
  }

  /**
   * Extract themes from text
   */
  extractThemes(text) {
    const themes = [];
    const allKeywords = Object.values(this.keywords).flat();

    allKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        themes.push(keyword);
      }
    });

    // Add thematic categories
    if (text.toLowerCase().includes('production') || text.toLowerCase().includes('output')) {
      themes.push('production');
    }
    if (text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
      themes.push('pricing');
    }
    if (text.toLowerCase().includes('regulation') || text.toLowerCase().includes('policy')) {
      themes.push('regulatory');
    }

    return [...new Set(themes)]; // Remove duplicates
  }

  /**
   * Extract named entities
   */
  extractEntities(text) {
    const entities = {
      companies: [],
      countries: [],
      organizations: [],
      commodities: [],
    };

    // Simulate entity extraction
    const companies = ['ExxonMobil', 'Shell', 'BP', 'Chevron', 'TotalEnergies', 'ConocoPhillips'];
    const countries = ['Saudi Arabia', 'Russia', 'USA', 'Iran', 'Iraq', 'UAE', 'Kuwait'];
    const organizations = ['OPEC', 'IEA', 'EIA', 'API', 'NYMEX', 'ICE'];

    companies.forEach(company => {
      if (text.includes(company)) entities.companies.push(company);
    });

    countries.forEach(country => {
      if (text.includes(country)) entities.countries.push(country);
    });

    organizations.forEach(org => {
      if (text.includes(org)) entities.organizations.push(org);
    });

    return entities;
  }

  /**
   * Get keyword context for better sentiment analysis
   */
  getKeywordContext(text, keyword) {
    const sentences = text.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence =>
      sentence.toLowerCase().includes(keyword.toLowerCase())
    );

    return relevantSentences.join('. ');
  }

  /**
   * Calculate overall sentiment from individual scores
   */
  calculateOverallSentiment(scores) {
    if (scores.length === 0) return { score: 0, label: 'NEUTRAL' };

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;

    let label = 'NEUTRAL';
    if (average > 0.3) label = 'POSITIVE';
    else if (average > 0.1) label = 'SLIGHTLY_POSITIVE';
    else if (average < -0.3) label = 'NEGATIVE';
    else if (average < -0.1) label = 'SLIGHTLY_NEGATIVE';

    return {
      score: average,
      label: label,
      confidence: Math.max(0, 1 - variance),
      sample_size: scores.length,
    };
  }

  /**
   * Calculate sentiment for each commodity
   */
  calculateCommoditySentiments(commodityScores) {
    const result = {};

    for (const [commodity, scores] of Object.entries(commodityScores)) {
      if (scores.length > 0) {
        result[commodity] = this.calculateOverallSentiment(scores);
      } else {
        result[commodity] = { score: 0, label: 'NEUTRAL', confidence: 0, sample_size: 0 };
      }
    }

    return result;
  }

  /**
   * Calculate sentiment trend over time
   */
  async calculateSentimentTrend(currentSentiment) {
    const historicalScores = this.sentimentHistory
      .slice(-10) // Last 10 analyses
      .map(h => h.overall_sentiment.score);

    if (historicalScores.length < 3) {
      return { trend: 'INSUFFICIENT_DATA', change: 0, direction: 'STABLE' };
    }

    const recent = historicalScores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
    const older =
      historicalScores.slice(0, -3).reduce((sum, score) => sum + score, 0) /
      (historicalScores.length - 3);

    const change = recent - older;
    let direction = 'STABLE';

    if (change > 0.1) direction = 'IMPROVING';
    else if (change < -0.1) direction = 'DECLINING';

    return {
      trend: direction,
      change: change,
      direction: direction,
      historical_average: older,
      recent_average: recent,
    };
  }

  /**
   * Get top themes by frequency
   */
  getTopThemes(themesMap, limit) {
    return Array.from(themesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([theme, count]) => ({ theme, mentions: count }));
  }

  /**
   * Generate trading recommendations based on sentiment
   */
  generateRecommendations(overall, byCommodity, alerts) {
    const recommendations = [];

    // Overall market sentiment recommendations
    if (overall.score > 0.5) {
      recommendations.push({
        type: 'SENTIMENT_BULLISH',
        action: 'Consider increasing long positions in energy markets',
        confidence: overall.confidence,
        timeframe: 'short_term',
      });
    } else if (overall.score < -0.5) {
      recommendations.push({
        type: 'SENTIMENT_BEARISH',
        action: 'Consider hedging positions or taking defensive stance',
        confidence: overall.confidence,
        timeframe: 'short_term',
      });
    }

    // Commodity-specific recommendations
    for (const [commodity, sentiment] of Object.entries(byCommodity)) {
      if (sentiment.score > 0.4 && sentiment.confidence > 0.6) {
        recommendations.push({
          type: 'COMMODITY_BULLISH',
          commodity: commodity,
          action: `Positive sentiment for ${commodity} suggests potential upside`,
          confidence: sentiment.confidence,
          timeframe: 'short_term',
        });
      } else if (sentiment.score < -0.4 && sentiment.confidence > 0.6) {
        recommendations.push({
          type: 'COMMODITY_BEARISH',
          commodity: commodity,
          action: `Negative sentiment for ${commodity} suggests potential downside`,
          confidence: sentiment.confidence,
          timeframe: 'short_term',
        });
      }
    }

    // Alert-based recommendations
    if (alerts.length > 3) {
      recommendations.push({
        type: 'HIGH_NEWS_ACTIVITY',
        action: 'High news activity detected - monitor for volatility',
        confidence: 0.8,
        timeframe: 'immediate',
      });
    }

    return recommendations;
  }

  /**
   * Calculate confidence based on analysis parameters
   */
  calculateConfidence(sampleSize, sentiment) {
    let confidence = 0.5; // Base confidence

    // Sample size factor
    if (sampleSize > 50) confidence += 0.2;
    else if (sampleSize > 20) confidence += 0.1;
    else if (sampleSize < 5) confidence -= 0.2;

    // Sentiment strength factor
    const sentimentStrength = Math.abs(sentiment.score);
    confidence += sentimentStrength * 0.3;

    // Consistency factor (low variance = higher confidence)
    confidence += (sentiment.confidence || 0) * 0.2;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Calculate text processing confidence
   */
  calculateTextConfidence(text) {
    let confidence = 0.7; // Base confidence for NLP

    // Text length factor
    if (text.length > 500) confidence += 0.1;
    else if (text.length < 100) confidence -= 0.2;

    // Keyword density factor
    const allKeywords = Object.values(this.keywords).flat();
    const keywordMatches = allKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    if (keywordMatches > 3) confidence += 0.1;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  // Helper methods
  getArticleCount(timeframe) {
    const counts = {
      '1h': 2,
      '6h': 5,
      '12h': 8,
      '24h': 15,
      '48h': 25,
      '7d': 50,
    };
    return counts[timeframe] || 15;
  }

  generateSimulatedArticle(source, commodities) {
    const titles = [
      'Oil prices surge on supply concerns amid geopolitical tensions',
      'Natural gas demand rises as winter approaches',
      'Renewable energy investments reach record highs',
      'OPEC+ considers production adjustments in response to market conditions',
      'U.S. crude inventories show unexpected decline',
      'Global energy transition accelerates with new policy initiatives',
      'Refinery outages impact regional fuel supplies',
      'LNG exports increase as European demand remains strong',
    ];

    const summaries = [
      'Market analysts report significant developments in energy sector fundamentals.',
      'Industry experts weigh in on current supply and demand dynamics.',
      'Economic indicators suggest continued volatility in commodity markets.',
      'Geopolitical events continue to influence global energy trade flows.',
      'Environmental regulations shape future investment strategies.',
      'Technological advancements drive efficiency improvements across the sector.',
    ];

    return {
      id: this.generateArticleId(),
      title: titles[Math.floor(Math.random() * titles.length)],
      summary: summaries[Math.floor(Math.random() * summaries.length)],
      source: source,
      published_at: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Last 24 hours
      url: `https://${source.toLowerCase().replace(/\s+/g, '')}.com/article/${Date.now()}`,
      author: 'Energy Reporter',
      category: commodities[Math.floor(Math.random() * commodities.length)],
    };
  }

  generateAnalysisId() {
    return `SENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateArticleId() {
    return `ART_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateSentimentHistory(result) {
    this.sentimentHistory.push({
      timestamp: result.timestamp,
      overall_sentiment: result.overall_sentiment,
      analysis_id: result.analysis_id,
    });

    // Keep only last 50 analyses
    if (this.sentimentHistory.length > 50) {
      this.sentimentHistory = this.sentimentHistory.slice(-50);
    }
  }

  /**
   * Get sentiment analysis for specific time period
   */
  getSentimentHistory(days = 7) {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.sentimentHistory.filter(h => new Date(h.timestamp) > cutoffTime);
  }

  /**
   * Get real-time sentiment alerts
   */
  getRealTimeAlerts() {
    const recentAnalyses = Array.from(this.sentimentCache.values()).filter(analysis => {
      const analysisTime = new Date(analysis.timestamp);
      const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours
      return analysisTime > cutoff;
    });

    const alerts = [];
    recentAnalyses.forEach(analysis => {
      if (analysis.alerts) {
        alerts.push(...analysis.alerts);
      }
    });

    return alerts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }

  /**
   * Clear old cache entries
   */
  cleanupCache() {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const [id, analysis] of this.sentimentCache.entries()) {
      if (new Date(analysis.timestamp) < cutoffTime) {
        this.sentimentCache.delete(id);
      }
    }

    for (const [id, news] of this.newsCache.entries()) {
      if (new Date(news.published_at) < cutoffTime) {
        this.newsCache.delete(id);
      }
    }
  }
}

module.exports = NLPSentimentAnalysisService;
