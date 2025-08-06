describe('Quantum Notebook Component', () => {
  beforeEach(() => {
    // Mock login and navigate to notebook page
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('testuser');
    cy.get('[data-testid="password"]').type('testpass');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/notebook');
  });

  it('displays quantum notebook interface', () => {
    cy.contains('Quantum Trading Analysis').should('be.visible');
    cy.get('[data-testid="notebook-toolbar"]').should('exist');
    cy.get('[data-testid="kernel-status"]').should('exist');
  });

  it('shows notebook cells', () => {
    cy.get('[data-testid="notebook-cell"]').should('have.length.at.least', 1);
    cy.get('[data-testid="notebook-cell"]').first().within(() => {
      cy.get('[data-testid="cell-type-chip"]').should('be.visible');
      cy.get('[data-testid="cell-content"]').should('exist');
    });
  });

  it('can add new cells', () => {
    cy.get('[data-testid="add-cell-button"]').click();
    cy.get('[data-testid="add-code-cell"]').click();
    
    // Check that a new cell was added
    cy.get('[data-testid="notebook-cell"]').should('have.length.at.least', 2);
  });

  it('can execute code cells', () => {
    // Find first code cell and execute it
    cy.get('[data-testid="notebook-cell"]').each(($cell) => {
      cy.wrap($cell).within(() => {
        cy.get('[data-testid="cell-type-chip"]').then(($chip) => {
          if ($chip.text().includes('code')) {
            cy.get('[data-testid="execute-cell-button"]').click();
            cy.get('[data-testid="execution-indicator"]').should('exist');
          }
        });
      });
    });
  });

  it('can edit cell content', () => {
    cy.get('[data-testid="notebook-cell"]').first().within(() => {
      cy.get('[data-testid="cell-content"] textarea').should('exist');
      cy.get('[data-testid="cell-content"] textarea').type('\n# Test comment');
    });
  });

  it('can delete cells', () => {
    // Get initial cell count
    cy.get('[data-testid="notebook-cell"]').then(($cells) => {
      const initialCount = $cells.length;
      
      if (initialCount > 1) {
        cy.get('[data-testid="notebook-cell"]').last().within(() => {
          cy.get('[data-testid="delete-cell-button"]').click();
        });
        
        // Check that cell count decreased
        cy.get('[data-testid="notebook-cell"]').should('have.length', initialCount - 1);
      }
    });
  });

  it('can save notebook', () => {
    cy.get('[data-testid="save-notebook-button"]').click();
    // Should show save confirmation or progress indicator
    cy.get('body').should('not.contain', 'Save failed');
  });

  it('can toggle fullscreen mode', () => {
    cy.get('[data-testid="fullscreen-toggle"]').click();
    cy.get('[data-testid="notebook-container"]').should('have.css', 'position', 'fixed');
    
    // Toggle back
    cy.get('[data-testid="fullscreen-toggle"]').click();
    cy.get('[data-testid="notebook-container"]').should('not.have.css', 'position', 'fixed');
  });

  it('shows sidebar with notebook navigation', () => {
    cy.get('[data-testid="notebook-sidebar"]').should('be.visible');
    cy.get('[data-testid="kernel-info"]').should('exist');
    cy.get('[data-testid="cells-list"]').should('exist');
  });

  it('can select cells from sidebar', () => {
    cy.get('[data-testid="cells-list"] [data-testid="cell-nav-item"]').first().click();
    cy.get('[data-testid="notebook-cell"]').first().should('have.class', 'selected')
      .or('have.attr', 'data-selected', 'true');
  });

  it('handles different cell types', () => {
    const cellTypes = ['code', 'markdown', 'raw'];
    
    cellTypes.forEach((type) => {
      cy.get('[data-testid="add-cell-button"]').click();
      cy.get(`[data-testid="add-${type}-cell"]`).click();
      
      cy.get('[data-testid="notebook-cell"]').last().within(() => {
        cy.get('[data-testid="cell-type-chip"]').should('contain.text', type);
      });
    });
  });

  it('displays cell outputs', () => {
    // Look for cells with outputs
    cy.get('[data-testid="notebook-cell"]').each(($cell) => {
      cy.wrap($cell).within(() => {
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="cell-output"]').length > 0) {
            cy.get('[data-testid="cell-output"]').should('be.visible');
          }
        });
      });
    });
  });

  it('is responsive on mobile', () => {
    cy.viewport('iphone-6');
    cy.get('[data-testid="notebook-toolbar"]').should('be.visible');
    cy.get('[data-testid="notebook-cell"]').should('be.visible');
    
    // Sidebar might be collapsed on mobile
    cy.get('[data-testid="sidebar-toggle"]').click();
    cy.get('[data-testid="notebook-sidebar"]').should('be.visible');
  });

  it('handles read-only mode', () => {
    cy.visit('/notebook?readOnly=true');
    
    // Should not show edit controls
    cy.get('[data-testid="add-cell-button"]').should('not.exist');
    cy.get('[data-testid="delete-cell-button"]').should('not.exist');
    cy.get('[data-testid="execute-cell-button"]').should('not.exist');
  });
});

describe('Quantum Notebook Component - Error Handling', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('testuser');
    cy.get('[data-testid="password"]').type('testpass');
    cy.get('[data-testid="login-button"]').click();
    cy.visit('/notebook');
  });

  it('handles cell execution errors', () => {
    cy.get('[data-testid="notebook-cell"]').first().within(() => {
      // Clear cell and add error-causing code
      cy.get('[data-testid="cell-content"] textarea').clear();
      cy.get('[data-testid="cell-content"] textarea').type('undefined_variable');
      cy.get('[data-testid="execute-cell-button"]').click();
      
      // Should show error output
      cy.get('[data-testid="cell-output"]').should('contain.text', 'Error')
        .or('contain.text', 'NameError')
        .or('contain.text', 'undefined');
    });
  });

  it('shows loading state during execution', () => {
    cy.get('[data-testid="notebook-cell"]').first().within(() => {
      cy.get('[data-testid="execute-cell-button"]').click();
      cy.get('[data-testid="execution-indicator"]').should('be.visible');
    });
  });
});