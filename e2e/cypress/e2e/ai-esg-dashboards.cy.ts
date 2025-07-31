describe('AI and ESG Dashboards', () => {
  beforeEach(() => {
    cy.login()
    
    // Mock AI analytics API
    cy.intercept('GET', '**/api/v1/ai/analytics', {
      fixture: 'ai-analytics.json'
    }).as('getAIAnalytics')
    
    // Mock ESG data API
    cy.intercept('GET', '**/api/v1/esg/metrics', {
      fixture: 'esg-metrics.json'
    }).as('getESGMetrics')
    
    // Mock predictions API
    cy.intercept('GET', '**/api/v1/ai/predictions', {
      fixture: 'ai-predictions.json'
    }).as('getAIPredictions')
  })

  describe('AI Dashboard', () => {
    it('should display AI analytics overview', () => {
      cy.visit('/ai-dashboard')
      cy.wait('@getAIAnalytics')
      
      // Verify main AI dashboard components
      cy.get('[data-testid="ai-dashboard-container"]').should('be.visible')
      cy.get('[data-testid="ai-insights-panel"]').should('be.visible')
      cy.get('[data-testid="prediction-accuracy-widget"]').should('be.visible')
      cy.get('[data-testid="ml-model-status"]').should('be.visible')
      cy.get('[data-testid="ai-recommendations"]').should('be.visible')
    })

    it('should display market predictions', () => {
      cy.visit('/ai-dashboard')
      cy.wait('@getAIPredictions')
      
      // Verify prediction components
      cy.get('[data-testid="price-predictions"]').should('be.visible')
      cy.get('[data-testid="volatility-forecast"]').should('be.visible')
      cy.get('[data-testid="trend-analysis"]').should('be.visible')
      
      // Test prediction details
      cy.get('[data-testid="prediction-item"]').first().click()
      cy.get('[data-testid="prediction-detail-modal"]').should('be.visible')
      cy.get('[data-testid="confidence-score"]').should('be.visible')
      cy.get('[data-testid="prediction-timeframe"]').should('be.visible')
      cy.get('[data-testid="model-used"]').should('be.visible')
    })

    it('should show AI trading recommendations', () => {
      cy.visit('/ai-dashboard')
      cy.wait('@getAIAnalytics')
      
      cy.get('[data-testid="ai-recommendations"]').within(() => {
        // Verify recommendation cards
        cy.get('[data-testid="recommendation-card"]').should('have.length.greaterThan', 0)
        
        // Check recommendation details
        cy.get('[data-testid="recommendation-card"]').first().within(() => {
          cy.get('[data-testid="commodity-name"]').should('be.visible')
          cy.get('[data-testid="recommendation-type"]').should('be.visible')
          cy.get('[data-testid="confidence-level"]').should('be.visible')
          cy.get('[data-testid="risk-rating"]').should('be.visible')
        })
      })
      
      // Test acting on recommendations
      cy.get('[data-testid="recommendation-card"]').first().within(() => {
        cy.get('[data-testid="act-on-recommendation-btn"]').click()
      })
      
      cy.get('[data-testid="trade-form-modal"]').should('be.visible')
      cy.get('[data-testid="pre-filled-commodity"]').should('not.be.empty')
    })

    it('should display model performance metrics', () => {
      cy.visit('/ai-dashboard')
      cy.wait('@getAIAnalytics')
      
      // Navigate to model performance section
      cy.get('[data-testid="model-performance-tab"]').click()
      
      cy.get('[data-testid="model-metrics"]').within(() => {
        cy.get('[data-testid="accuracy-score"]').should('be.visible')
        cy.get('[data-testid="precision-score"]').should('be.visible')
        cy.get('[data-testid="recall-score"]').should('be.visible')
        cy.get('[data-testid="f1-score"]').should('be.visible')
      })
      
      // Test model comparison
      cy.get('[data-testid="compare-models-btn"]').click()
      cy.get('[data-testid="model-comparison-chart"]').should('be.visible')
    })

    it('should configure AI settings', () => {
      cy.visit('/ai-dashboard')
      
      cy.get('[data-testid="ai-settings-btn"]').click()
      cy.get('[data-testid="ai-settings-modal"]').should('be.visible')
      
      cy.get('[data-testid="ai-settings-modal"]').within(() => {
        // Configure prediction frequency
        cy.get('[data-testid="prediction-frequency-select"]').select('hourly')
        
        // Set confidence threshold
        cy.get('[data-testid="confidence-threshold-slider"]').invoke('val', 75).trigger('change')
        
        // Enable/disable specific models
        cy.get('[data-testid="lstm-model-toggle"]').check()
        cy.get('[data-testid="random-forest-toggle"]').check()
        cy.get('[data-testid="neural-network-toggle"]').uncheck()
        
        // Configure alert thresholds
        cy.get('[data-testid="alert-threshold-input"]').clear().type('5.0')
        
        cy.get('[data-testid="save-ai-settings-btn"]').click()
      })
      
      cy.get('[data-testid="success-message"]').should('contain', 'AI settings updated')
    })

    it('should handle AI model training', () => {
      cy.visit('/ai-dashboard')
      
      // Navigate to model training section
      cy.get('[data-testid="model-training-tab"]').click()
      
      cy.get('[data-testid="start-training-btn"]').click()
      
      // Mock training progress
      cy.intercept('GET', '**/api/v1/ai/training/status', {
        body: { status: 'training', progress: 45, eta: '10 minutes' }
      }).as('getTrainingStatus')
      
      cy.wait('@getTrainingStatus')
      
      cy.get('[data-testid="training-progress"]').should('be.visible')
      cy.get('[data-testid="progress-bar"]').should('have.attr', 'aria-valuenow', '45')
      cy.get('[data-testid="training-eta"]').should('contain', '10 minutes')
    })
  })

  describe('ESG Dashboard', () => {
    it('should display ESG metrics overview', () => {
      cy.visit('/esg-dashboard')
      cy.wait('@getESGMetrics')
      
      // Verify ESG dashboard components
      cy.get('[data-testid="esg-dashboard-container"]').should('be.visible')
      cy.get('[data-testid="esg-score-widget"]').should('be.visible')
      cy.get('[data-testid="environmental-metrics"]').should('be.visible')
      cy.get('[data-testid="social-metrics"]').should('be.visible')
      cy.get('[data-testid="governance-metrics"]').should('be.visible')
    })

    it('should show environmental impact metrics', () => {
      cy.visit('/esg-dashboard')
      cy.wait('@getESGMetrics')
      
      cy.get('[data-testid="environmental-tab"]').click()
      
      cy.get('[data-testid="environmental-metrics"]').within(() => {
        cy.get('[data-testid="carbon-footprint"]').should('be.visible')
        cy.get('[data-testid="renewable-energy-percentage"]').should('be.visible')
        cy.get('[data-testid="water-usage"]').should('be.visible')
        cy.get('[data-testid="waste-management"]').should('be.visible')
      })
      
      // Test carbon footprint details
      cy.get('[data-testid="carbon-footprint"]').click()
      cy.get('[data-testid="carbon-detail-modal"]').should('be.visible')
      cy.get('[data-testid="carbon-breakdown-chart"]').should('be.visible')
    })

    it('should display social responsibility metrics', () => {
      cy.visit('/esg-dashboard')
      cy.wait('@getESGMetrics')
      
      cy.get('[data-testid="social-tab"]').click()
      
      cy.get('[data-testid="social-metrics"]').within(() => {
        cy.get('[data-testid="community-investment"]').should('be.visible')
        cy.get('[data-testid="employee-diversity"]').should('be.visible')
        cy.get('[data-testid="safety-metrics"]').should('be.visible')
        cy.get('[data-testid="human-rights-score"]').should('be.visible')
      })
    })

    it('should show governance indicators', () => {
      cy.visit('/esg-dashboard')
      cy.wait('@getESGMetrics')
      
      cy.get('[data-testid="governance-tab"]').click()
      
      cy.get('[data-testid="governance-metrics"]').within(() => {
        cy.get('[data-testid="board-diversity"]').should('be.visible')
        cy.get('[data-testid="transparency-score"]').should('be.visible')
        cy.get('[data-testid="ethics-compliance"]').should('be.visible')
        cy.get('[data-testid="risk-management"]').should('be.visible')
      })
    })

    it('should generate ESG reports', () => {
      cy.visit('/esg-dashboard')
      
      cy.get('[data-testid="generate-report-btn"]').click()
      cy.get('[data-testid="report-options-modal"]').should('be.visible')
      
      cy.get('[data-testid="report-options-modal"]').within(() => {
        // Select report type
        cy.get('[data-testid="report-type-select"]').select('quarterly')
        
        // Select metrics to include
        cy.get('[data-testid="include-environmental"]').check()
        cy.get('[data-testid="include-social"]').check()
        cy.get('[data-testid="include-governance"]').check()
        
        // Set date range
        cy.get('[data-testid="report-start-date"]').type('2024-01-01')
        cy.get('[data-testid="report-end-date"]').type('2024-03-31')
        
        cy.get('[data-testid="generate-report-submit"]').click()
      })
      
      // Mock report generation
      cy.intercept('POST', '**/api/v1/esg/reports', {
        statusCode: 200,
        body: { reportId: 'esg-report-123', status: 'generating' }
      }).as('generateReport')
      
      cy.wait('@generateReport')
      cy.get('[data-testid="report-generation-message"]').should('contain', 'Report is being generated')
    })

    it('should set ESG targets and track progress', () => {
      cy.visit('/esg-dashboard')
      
      cy.get('[data-testid="esg-targets-tab"]').click()
      
      // Set new target
      cy.get('[data-testid="add-target-btn"]').click()
      cy.get('[data-testid="target-form-modal"]').should('be.visible')
      
      cy.get('[data-testid="target-form-modal"]').within(() => {
        cy.get('[data-testid="target-category-select"]').select('environmental')
        cy.get('[data-testid="target-metric-select"]').select('carbon_reduction')
        cy.get('[data-testid="target-value-input"]').type('25')
        cy.get('[data-testid="target-deadline"]').type('2024-12-31')
        cy.get('[data-testid="save-target-btn"]').click()
      })
      
      // Verify target is added
      cy.get('[data-testid="target-item"]').should('contain', 'Carbon Reduction')
      cy.get('[data-testid="target-progress"]').should('be.visible')
    })

    it('should benchmark against industry standards', () => {
      cy.visit('/esg-dashboard')
      
      cy.get('[data-testid="benchmarking-tab"]').click()
      
      // Mock benchmarking data
      cy.intercept('GET', '**/api/v1/esg/benchmarks', {
        fixture: 'esg-benchmarks.json'
      }).as('getBenchmarks')
      
      cy.wait('@getBenchmarks')
      
      cy.get('[data-testid="benchmark-comparison"]').should('be.visible')
      cy.get('[data-testid="industry-average"]').should('be.visible')
      cy.get('[data-testid="peer-comparison"]').should('be.visible')
      cy.get('[data-testid="ranking-position"]').should('be.visible')
    })
  })

  describe('Integration Between AI and ESG', () => {
    it('should show AI-powered ESG predictions', () => {
      cy.visit('/esg-dashboard')
      
      cy.get('[data-testid="ai-esg-predictions"]').should('be.visible')
      cy.get('[data-testid="ai-esg-predictions"]').within(() => {
        cy.get('[data-testid="predicted-esg-score"]').should('be.visible')
        cy.get('[data-testid="improvement-recommendations"]').should('be.visible')
      })
    })

    it('should use ESG factors in AI trading recommendations', () => {
      cy.visit('/ai-dashboard')
      
      cy.get('[data-testid="ai-recommendations"]').within(() => {
        cy.get('[data-testid="recommendation-card"]').first().within(() => {
          cy.get('[data-testid="esg-score"]').should('be.visible')
          cy.get('[data-testid="sustainability-rating"]').should('be.visible')
        })
      })
    })
  })

  describe('Accessibility and Mobile Support', () => {
    it('should be accessible', () => {
      cy.visit('/ai-dashboard')
      cy.checkAccessibility()
      
      cy.visit('/esg-dashboard')
      cy.checkAccessibility()
    })

    it('should work on mobile devices', () => {
      cy.viewport('iphone-x')
      
      cy.visit('/ai-dashboard')
      cy.get('[data-testid="mobile-ai-dashboard"]').should('be.visible')
      
      cy.visit('/esg-dashboard')
      cy.get('[data-testid="mobile-esg-dashboard"]').should('be.visible')
    })
  })
})