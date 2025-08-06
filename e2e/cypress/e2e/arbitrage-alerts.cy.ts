describe('Arbitrage Alerts Component', () => {
  beforeEach(() => {
    // Mock login and navigate to arbitrage alerts page
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('testuser');
    cy.get('[data-testid="password"]').type('testpass');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/arbitrage');
  });

  it('displays arbitrage alerts page', () => {
    cy.contains('Arbitrage Alerts').should('be.visible');
    cy.get('[data-testid="connection-status"]').should('exist');
  });

  it('shows connection status', () => {
    cy.get('[data-testid="connection-status"]').should('contain.text', 'connecting').or('contain.text', 'connected');
  });

  it('can toggle notifications', () => {
    cy.get('[data-testid="notifications-toggle"]').should('exist');
    cy.get('[data-testid="notifications-toggle"]').click();
    // Check that notification state changes
    cy.get('[data-testid="notifications-toggle"]').should('have.attr', 'aria-checked');
  });

  it('displays alerts when available', () => {
    // Wait for potential alerts to load
    cy.wait(3000);
    
    // Check if alerts container exists
    cy.get('[data-testid="alerts-container"]').should('exist');
    
    // If alerts are present, test their structure
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="alert-card"]').length > 0) {
        cy.get('[data-testid="alert-card"]').first().within(() => {
          cy.get('[data-testid="commodity-name"]').should('be.visible');
          cy.get('[data-testid="spread-percentage"]').should('be.visible');
          cy.get('[data-testid="market-comparison"]').should('exist');
        });
      }
    });
  });

  it('can expand alert details', () => {
    cy.wait(3000);
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="expand-alert-button"]').length > 0) {
        cy.get('[data-testid="expand-alert-button"]').first().click();
        cy.get('[data-testid="alert-details"]').should('be.visible');
        cy.get('[data-testid="price-chart"]').should('exist');
        cy.get('[data-testid="market-table"]').should('be.visible');
      }
    });
  });

  it('handles different regions', () => {
    // Test that component can handle different region props
    const regions = ['us', 'europe', 'uk', 'guyana', 'middle-east'];
    
    regions.forEach((region) => {
      cy.visit(`/arbitrage?region=${region}`);
      cy.contains('Arbitrage Alerts').should('be.visible');
    });
  });

  it('shows no alerts message when empty', () => {
    // If no alerts, should show appropriate message
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="alert-card"]').length === 0) {
        cy.contains('No arbitrage alerts available').should('be.visible');
        cy.contains('Monitoring markets for opportunities').should('be.visible');
      }
    });
  });

  it('is responsive on mobile', () => {
    cy.viewport('iphone-6');
    cy.contains('Arbitrage Alerts').should('be.visible');
    cy.get('[data-testid="connection-status"]').should('be.visible');
  });

  it('shows compliance status for alerts', () => {
    cy.wait(3000);
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="alert-card"]').length > 0) {
        cy.get('[data-testid="expand-alert-button"]').first().click();
        cy.get('[data-testid="compliance-chip"]').should('exist');
        cy.get('[data-testid="compliance-chip"]').should('contain.text', 'compliant')
          .or('contain.text', 'warning')
          .or('contain.text', 'violation');
      }
    });
  });
});

describe('Arbitrage Alerts Component - Compact Mode', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('testuser');
    cy.get('[data-testid="password"]').type('testpass');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/arbitrage?compact=true');
  });

  it('displays in compact mode', () => {
    cy.contains('Arbitrage Alerts').should('be.visible');
    cy.get('[data-testid="alerts-count"]').should('exist');
  });
});