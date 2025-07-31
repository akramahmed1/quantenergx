describe('Security E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Authentication Security', () => {
    it('should protect against session fixation', () => {
      // Get initial session ID
      cy.getCookie('sessionId').then((initialCookie) => {
        const initialSessionId = initialCookie?.value;
        
        // Login
        cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
        cy.get('[data-testid="login-password"]').type('password123');
        cy.get('[data-testid="login-submit"]').click();
        
        // Session ID should change after login
        cy.getCookie('sessionId').should((newCookie) => {
          expect(newCookie?.value).to.not.equal(initialSessionId);
        });
      });
    });

    it('should handle logout securely', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      cy.url().should('include', '/dashboard');
      
      // Logout
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Session cookie should be cleared
      cy.getCookie('sessionId').should('not.exist');
      
      // Should not be able to access protected pages
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should prevent unauthorized access to protected routes', () => {
      const protectedRoutes = ['/dashboard', '/trading', '/portfolio', '/settings'];
      
      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should handle expired sessions', () => {
      // Login
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Simulate expired session by clearing auth token
      cy.window().then((win) => {
        win.localStorage.removeItem('authToken');
      });
      
      // Try to access protected resource
      cy.get('[data-testid="nav-portfolio"]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="session-expired-message"]').should('be.visible');
    });

    it('should rate limit login attempts', () => {
      const attempts = 6; // Assuming rate limit is 5 attempts
      
      for (let i = 0; i < attempts; i++) {
        cy.get('[data-testid="login-email"]').clear().type('test@quantenergx.com');
        cy.get('[data-testid="login-password"]').clear().type('wrongpassword');
        cy.get('[data-testid="login-submit"]').click();
        
        if (i < 4) {
          cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
        } else {
          cy.get('[data-testid="error-message"]').should('contain', 'Too many attempts');
        }
      }
    });
  });

  describe('Input Security', () => {
    it('should prevent XSS in form inputs', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
      ];
      
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Navigate to profile settings
      cy.get('[data-testid="nav-settings"]').click();
      
      xssPayloads.forEach(payload => {
        cy.get('[data-testid="profile-name"]').clear().type(payload);
        cy.get('[data-testid="save-profile"]').click();
        
        // Should not execute script, should show escaped text
        cy.get('[data-testid="profile-display-name"]').should('not.contain', '<script>');
        cy.get('[data-testid="profile-display-name"]').should('contain.text', payload.replace(/<[^>]*>/g, ''));
      });
    });

    it('should validate file uploads', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Navigate to document upload
      cy.get('[data-testid="nav-documents"]').click();
      
      // Test malicious file types
      const maliciousFiles = [
        { name: 'malicious.exe', type: 'application/x-executable' },
        { name: 'script.js', type: 'application/javascript' },
        { name: 'virus.bat', type: 'application/x-bat' },
      ];
      
      maliciousFiles.forEach(file => {
        cy.get('[data-testid="file-upload"]').selectFile({
          contents: 'malicious content',
          fileName: file.name,
          mimeType: file.type,
        }, { force: true });
        
        cy.get('[data-testid="upload-submit"]').click();
        cy.get('[data-testid="error-message"]').should('contain', 'Invalid file type');
      });
      
      // Test valid file
      cy.get('[data-testid="file-upload"]').selectFile({
        contents: 'valid document content',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
      }, { force: true });
      
      cy.get('[data-testid="upload-submit"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should prevent SQL injection in search', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Navigate to search
      cy.get('[data-testid="nav-search"]').click();
      
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; EXEC xp_cmdshell('dir'); --",
      ];
      
      sqlInjectionPayloads.forEach(payload => {
        cy.get('[data-testid="search-input"]').clear().type(payload);
        cy.get('[data-testid="search-submit"]').click();
        
        // Should return safe search results or error, not database error
        cy.get('[data-testid="search-results"]').should('exist');
        cy.get('body').should('not.contain', 'SQL');
        cy.get('body').should('not.contain', 'database');
        cy.get('body').should('not.contain', 'syntax error');
      });
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF tokens in forms', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Check for CSRF token in forms
      cy.get('form[data-testid="trading-order-form"]').within(() => {
        cy.get('input[name="_csrf"]').should('exist');
        cy.get('input[name="_csrf"]').should('have.attr', 'type', 'hidden');
        cy.get('input[name="_csrf"]').should('have.value').and('not.be.empty');
      });
    });

    it('should validate CSRF tokens on form submission', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Navigate to trading
      cy.get('[data-testid="nav-trading"]').click();
      
      // Tamper with CSRF token
      cy.get('input[name="_csrf"]').invoke('val', 'invalid-csrf-token');
      
      // Fill and submit form
      cy.get('[data-testid="symbol-select"]').select('CRUDE_OIL');
      cy.get('[data-testid="order-side"]').select('buy');
      cy.get('[data-testid="order-quantity"]').type('100');
      cy.get('[data-testid="order-submit"]').click();
      
      // Should reject with CSRF error
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid request');
    });
  });

  describe('Content Security Policy', () => {
    it('should have proper CSP headers', () => {
      cy.request('/').then((response) => {
        expect(response.headers).to.have.property('content-security-policy');
        
        const csp = response.headers['content-security-policy'];
        expect(csp).to.include("default-src 'self'");
        expect(csp).to.include("script-src 'self'");
        expect(csp).to.include("style-src 'self'");
      });
    });

    it('should block inline scripts', () => {
      // Try to inject inline script via DOM manipulation
      cy.window().then((win) => {
        const script = win.document.createElement('script');
        script.innerHTML = 'window.xssExecuted = true;';
        win.document.head.appendChild(script);
      });
      
      // Script should not execute due to CSP
      cy.window().should('not.have.property', 'xssExecuted');
    });
  });

  describe('Secure Headers', () => {
    it('should have security headers', () => {
      cy.request('/').then((response) => {
        // Check for security headers
        expect(response.headers).to.have.property('x-frame-options');
        expect(response.headers).to.have.property('x-content-type-options');
        expect(response.headers).to.have.property('x-xss-protection');
        expect(response.headers).to.have.property('strict-transport-security');
        
        // Verify header values
        expect(response.headers['x-frame-options']).to.equal('DENY');
        expect(response.headers['x-content-type-options']).to.equal('nosniff');
        expect(response.headers['x-xss-protection']).to.include('1; mode=block');
      });
    });

    it('should prevent clickjacking', () => {
      // Verify X-Frame-Options header prevents framing
      cy.request('/').then((response) => {
        expect(response.headers['x-frame-options']).to.be.oneOf(['DENY', 'SAMEORIGIN']);
      });
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in client-side storage', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Check localStorage for sensitive data
      cy.window().then((win) => {
        const localStorage = win.localStorage;
        const localStorageData = Object.keys(localStorage).map(key => localStorage.getItem(key)).join(' ');
        
        // Should not contain sensitive patterns
        expect(localStorageData).to.not.match(/password|ssn|creditcard|secret/i);
      });
      
      // Check sessionStorage
      cy.window().then((win) => {
        const sessionStorage = win.sessionStorage;
        const sessionStorageData = Object.keys(sessionStorage).map(key => sessionStorage.getItem(key)).join(' ');
        
        expect(sessionStorageData).to.not.match(/password|ssn|creditcard|secret/i);
      });
    });

    it('should mask sensitive data in UI', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Navigate to account settings
      cy.get('[data-testid="nav-account"]').click();
      
      // Check that sensitive data is masked
      cy.get('[data-testid="account-number"]').should('contain', 'XXXX-XXXX-XXXX-');
      cy.get('[data-testid="ssn"]').should('contain', 'XXX-XX-');
    });
  });

  describe('Session Security', () => {
    it('should timeout inactive sessions', () => {
      // Login first
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Simulate session timeout (mock the timestamp)
      cy.window().then((win) => {
        const expiredTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
        win.localStorage.setItem('lastActivity', expiredTime.toString());
      });
      
      // Try to access a protected page
      cy.visit('/dashboard');
      
      // Should redirect to login due to timeout
      cy.url().should('include', '/login');
      cy.get('[data-testid="session-timeout-message"]').should('be.visible');
    });

    it('should prevent concurrent sessions', () => {
      // This would require backend support for session management
      // Login in first browser/tab context
      cy.get('[data-testid="login-email"]').type('test@quantenergx.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();
      
      cy.url().should('include', '/dashboard');
      
      // Simulate login from another location
      cy.window().then((win) => {
        // This would trigger a server-side session invalidation
        // For testing, we can simulate the effect
        win.localStorage.setItem('sessionInvalidated', 'true');
      });
      
      // Next API call should detect session invalidation
      cy.get('[data-testid="refresh-data"]').click();
      
      // Should redirect to login with message
      cy.url().should('include', '/login');
      cy.get('[data-testid="session-conflict-message"]').should('be.visible');
    });
  });
});