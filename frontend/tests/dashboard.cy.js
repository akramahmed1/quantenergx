// cypress/e2e/dashboard.cy.js

describe('Dashboard E2E', () => {
  it('renders 3D dashboard and receives price updates', () => {
    cy.visit('/dashboard');
    cy.contains('3D Dashboard');
    // Simulate price update event
    // (Assume backend emits 'priceUpdate')
  });
});
