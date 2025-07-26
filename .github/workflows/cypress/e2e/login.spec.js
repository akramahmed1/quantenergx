describe('Login Flow', () => {
  it('should allow a user to log in', () => {
    cy.visit('/login');
    cy.get('input[name=username]').type('vibeuser');
    cy.get('input[name=password]').type('securepassword');
    cy.get('button[type=submit]').click();
    cy.url().should('include', '/dashboard');
  });
});
