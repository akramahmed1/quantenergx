describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('should pass accessibility audit on home page', () => {
    cy.checkA11y();
  });

  it('should pass accessibility audit on dashboard', () => {
    // Login first
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.checkA11y();
  });

  it('should pass accessibility audit on trading page', () => {
    // Login and navigate to trading
    cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    
    cy.get('[data-testid="nav-trading"]').click();
    cy.url().should('include', '/trading');
    cy.checkA11y();
  });

  it('should have proper keyboard navigation', () => {
    // Test tab navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'login-email');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'login-password');
    
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'login-submit');
  });

  it('should have proper ARIA labels', () => {
    cy.get('[data-testid="login-email"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Email');
    
    cy.get('[data-testid="login-password"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Password');
    
    cy.get('[data-testid="login-submit"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Sign in');
  });

  it('should support screen readers', () => {
    // Check for screen reader friendly elements
    cy.get('main').should('have.attr', 'role', 'main');
    cy.get('nav').should('have.attr', 'role', 'navigation');
    
    // Check for skip links
    cy.get('a[href="#main-content"]').should('exist');
    
    // Check for heading hierarchy
    cy.get('h1').should('exist');
    cy.get('h1').should('have.length', 1); // Only one h1 per page
  });

  it('should have sufficient color contrast', () => {
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  it('should be usable with high contrast mode', () => {
    // Simulate high contrast mode
    cy.get('body').invoke('attr', 'style', 'filter: invert(1) hue-rotate(180deg);');
    
    // Basic functionality should still work
    cy.get('[data-testid="login-email"]').should('be.visible');
    cy.get('[data-testid="login-password"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

  it('should handle focus management in modals', () => {
    // Open a modal
    cy.get('[data-testid="open-modal-button"]').click();
    
    // Focus should be trapped in modal
    cy.get('[data-testid="modal"]').should('be.visible');
    cy.focused().should('be.within', '[data-testid="modal"]');
    
    // Tab should cycle within modal
    cy.focused().tab();
    cy.focused().should('be.within', '[data-testid="modal"]');
    
    // Escape should close modal and restore focus
    cy.get('body').type('{esc}');
    cy.get('[data-testid="modal"]').should('not.exist');
    cy.focused().should('have.attr', 'data-testid', 'open-modal-button');
  });

  it('should provide error announcements', () => {
    // Trigger an error
    cy.get('[data-testid="login-submit"]').click();
    
    // Error should be announced to screen readers
    cy.get('[role="alert"]').should('exist');
    cy.get('[role="alert"]').should('contain.text', 'email is required');
  });

  it('should support reduced motion preferences', () => {
    // Mock reduced motion preference
    cy.window().then((win) => {
      Object.defineProperty(win, 'matchMedia', {
        writable: true,
        value: cy.stub().returns({
          matches: true, // prefers-reduced-motion: reduce
          addEventListener: cy.stub(),
          removeEventListener: cy.stub(),
        }),
      });
    });
    
    cy.reload();
    
    // Animations should be disabled or reduced
    cy.get('[data-testid="animated-element"]')
      .should('have.css', 'animation-duration', '0s')
      .or('have.css', 'animation-duration', '0.01s');
  });
});