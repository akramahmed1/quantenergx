describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should match login page visual baseline', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.compareSnapshot('login-page');
  });

  it('should match dashboard visual baseline', () => {
    // Login first
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-content"]').should('be.visible');
    
    // Wait for data to load
    cy.get('[data-testid="portfolio-summary"]').should('be.visible');
    
    cy.compareSnapshot('dashboard-page');
  });

  it('should match trading interface visual baseline', () => {
    // Login and navigate to trading
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.get('[data-testid="nav-trading"]').click();
    cy.url().should('include', '/trading');
    
    // Wait for market data to load
    cy.get('[data-testid="price-chart"]').should('be.visible');
    cy.get('[data-testid="order-form"]').should('be.visible');
    
    cy.compareSnapshot('trading-interface');
  });

  it('should match mobile layout visual baseline', () => {
    cy.viewport('iphone-x');
    
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.compareSnapshot('mobile-login-page');
    
    // Test mobile navigation
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    cy.compareSnapshot('mobile-menu-open');
  });

  it('should match dark theme visual baseline', () => {
    // Switch to dark theme
    cy.get('[data-testid="theme-toggle"]').click();
    cy.get('body').should('have.class', 'dark-theme');
    
    cy.compareSnapshot('login-page-dark-theme');
    
    // Login and check dashboard in dark theme
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.compareSnapshot('dashboard-dark-theme');
  });

  it('should detect visual regressions in components', () => {
    // Test individual components
    cy.visit('/storybook'); // Assuming Storybook is available
    
    // Button component variations
    cy.get('[data-testid="primary-button"]').compareSnapshot('primary-button');
    cy.get('[data-testid="secondary-button"]').compareSnapshot('secondary-button');
    cy.get('[data-testid="danger-button"]').compareSnapshot('danger-button');
    
    // Form components
    cy.get('[data-testid="text-input"]').compareSnapshot('text-input');
    cy.get('[data-testid="select-dropdown"]').compareSnapshot('select-dropdown');
    cy.get('[data-testid="checkbox"]').compareSnapshot('checkbox');
  });

  it('should handle loading states consistently', () => {
    // Mock slow API response
    cy.intercept('GET', '/api/dashboard/data', { delay: 2000 }).as('dashboardData');
    
    // Login
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    // Capture loading state
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.compareSnapshot('dashboard-loading-state');
    
    // Wait for data to load and capture final state
    cy.wait('@dashboardData');
    cy.get('[data-testid="dashboard-content"]').should('be.visible');
    cy.compareSnapshot('dashboard-loaded-state');
  });

  it('should maintain visual consistency across different data states', () => {
    // Test empty state
    cy.intercept('GET', '/api/portfolio/positions', { body: [] }).as('emptyPositions');
    
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.get('[data-testid="nav-portfolio"]').click();
    cy.wait('@emptyPositions');
    
    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.compareSnapshot('portfolio-empty-state');
    
    // Test error state
    cy.intercept('GET', '/api/portfolio/positions', { statusCode: 500 }).as('errorPositions');
    cy.reload();
    
    cy.wait('@errorPositions');
    cy.get('[data-testid="error-state"]').should('be.visible');
    cy.compareSnapshot('portfolio-error-state');
  });

  it('should test responsive design breakpoints', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      
      // Test main navigation at different breakpoints
      cy.get('[data-testid="main-nav"]').should('be.visible');
      cy.compareSnapshot(`navigation-${viewport.name}`);
      
      // Login and test dashboard layout
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      cy.compareSnapshot(`dashboard-${viewport.name}`);
      
      // Reset for next iteration
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit('/');
    });
  });

  it('should test print styles', () => {
    // Login and navigate to a page with printable content
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.get('[data-testid="nav-reports"]').click();
    
    // Apply print styles
    cy.get('body').invoke('attr', 'style', 'margin: 0; background: white;');
    cy.get('head').invoke('append', '<style media="print">@media print { .no-print { display: none !important; } }</style>');
    
    // Simulate print view
    cy.get('.no-print').should('not.be.visible');
    cy.compareSnapshot('reports-print-view');
  });

  it('should test high contrast mode compatibility', () => {
    // Simulate Windows high contrast mode
    cy.get('body').invoke('attr', 'style', `
      background: black !important;
      color: white !important;
      filter: invert(1) hue-rotate(180deg);
    `);
    
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.compareSnapshot('login-high-contrast');
    
    // Test form elements in high contrast
    cy.get('[data-testid="login-email"]').should('be.visible');
    cy.get('[data-testid="login-password"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

  it('should test animation and transition states', () => {
    // Test modal animation
    cy.get('[data-testid="open-modal-button"]').click();
    
    // Capture modal opening animation
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.wait(100); // Wait for animation to start
    cy.compareSnapshot('modal-opening');
    
    cy.wait(400); // Wait for animation to complete
    cy.compareSnapshot('modal-open');
    
    // Test modal closing animation
    cy.get('[data-testid="modal-close"]').click();
    cy.wait(100);
    cy.compareSnapshot('modal-closing');
  });
});