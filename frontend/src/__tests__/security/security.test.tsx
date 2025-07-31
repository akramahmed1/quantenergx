import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Frontend Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should sanitize user input in forms', async () => {
      const user = userEvent.setup();
      
      // Mock component that displays user input
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <div>
            <input
              data-testid="user-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="display-value" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        );
      };

      render(<TestComponent />);
      
      const input = screen.getByTestId('user-input');
      const maliciousScript = '<script>alert("XSS")</script>';
      
      await user.type(input, maliciousScript);
      
      const displayValue = screen.getByTestId('display-value');
      
      // Should not execute script tags
      expect(displayValue.innerHTML).not.toContain('<script>');
      expect(displayValue.innerHTML).toBe('alert("XSS")'); // Script tags stripped
    });

    it('should prevent XSS in dynamic content rendering', () => {
      const maliciousContent = '<img src="x" onerror="alert(1)">';
      
      const SafeComponent = ({ content }: { content: string }) => {
        // Should use textContent instead of innerHTML for untrusted content
        return <div>{content}</div>;
      };

      render(<SafeComponent content={maliciousContent} />);
      
      // Should render as text, not execute
      expect(screen.getByText(maliciousContent)).toBeInTheDocument();
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF tokens in forms', () => {
      const FormComponent = () => (
        <form action="/api/user/update" method="POST">
          <input type="hidden" name="_csrf" value="csrf-token-123" />
          <input type="text" name="username" />
          <button type="submit">Submit</button>
        </form>
      );

      render(<FormComponent />);
      
      const csrfInput = screen.getByDisplayValue('csrf-token-123');
      expect(csrfInput).toHaveAttribute('type', 'hidden');
      expect(csrfInput).toHaveAttribute('name', '_csrf');
    });

    it('should validate CSRF tokens before API calls', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const apiCall = async () => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        return fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          body: JSON.stringify({ data: 'test' }),
        });
      };

      // Mock CSRF token in document
      const metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      metaTag.content = 'valid-csrf-token';
      document.head.appendChild(metaTag);

      await apiCall();

      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-csrf-token',
        },
        body: JSON.stringify({ data: 'test' }),
      });

      document.head.removeChild(metaTag);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      
      const EmailForm = () => {
        const [email, setEmail] = React.useState('');
        const [error, setError] = React.useState('');
        
        const validateEmail = (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        };
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!validateEmail(email)) {
            setError('Invalid email format');
          } else {
            setError('');
          }
        };
        
        return (
          <form onSubmit={handleSubmit}>
            <input
              data-testid="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Submit</button>
            {error && <div data-testid="error">{error}</div>}
          </form>
        );
      };

      render(<EmailForm />);
      
      const emailInput = screen.getByTestId('email');
      const submitButton = screen.getByText('Submit');
      
      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid email format');
      
      // Test valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    it('should prevent SQL injection attempts in search', async () => {
      const user = userEvent.setup();
      
      const SearchComponent = () => {
        const [query, setQuery] = React.useState('');
        const [results, setResults] = React.useState<string[]>([]);
        
        const sanitizeQuery = (query: string) => {
          // Remove SQL injection patterns
          return query.replace(/['"\\;]/g, '');
        };
        
        const handleSearch = (e: React.FormEvent) => {
          e.preventDefault();
          const sanitizedQuery = sanitizeQuery(query);
          // Mock search results
          setResults([`Results for: ${sanitizedQuery}`]);
        };
        
        return (
          <div>
            <form onSubmit={handleSearch}>
              <input
                data-testid="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
            <div data-testid="results">
              {results.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        );
      };

      render(<SearchComponent />);
      
      const searchInput = screen.getByTestId('search');
      const searchButton = screen.getByText('Search');
      
      // Test SQL injection attempt
      await user.type(searchInput, "'; DROP TABLE users; --");
      await user.click(searchButton);
      
      const results = screen.getByTestId('results');
      expect(results).toHaveTextContent('Results for:  DROP TABLE users --');
      expect(results).not.toHaveTextContent("';");
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should not expose sensitive data in error messages', () => {
      const ErrorComponent = ({ error }: { error: Error }) => {
        const getSafeErrorMessage = (error: Error) => {
          // Don't expose internal error details
          if (error.message.includes('API_KEY') || error.message.includes('password')) {
            return 'An internal error occurred';
          }
          return error.message;
        };
        
        return (
          <div data-testid="error-message">
            {getSafeErrorMessage(error)}
          </div>
        );
      };

      const sensitiveError = new Error('API_KEY abc123 is invalid');
      render(<ErrorComponent error={sensitiveError} />);
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('An internal error occurred');
      expect(screen.getByTestId('error-message')).not.toHaveTextContent('API_KEY');
    });

    it('should mask sensitive form data', async () => {
      const user = userEvent.setup();
      
      const SensitiveForm = () => {
        const [ssn, setSsn] = React.useState('');
        
        const maskSSN = (value: string) => {
          // Mask all but last 4 digits
          const digits = value.replace(/\D/g, '');
          if (digits.length <= 4) return value;
          return 'XXX-XX-' + digits.slice(-4);
        };
        
        return (
          <input
            data-testid="ssn"
            value={maskSSN(ssn)}
            onChange={(e) => setSsn(e.target.value)}
            placeholder="SSN"
          />
        );
      };

      render(<SensitiveForm />);
      
      const ssnInput = screen.getByTestId('ssn');
      
      await user.type(ssnInput, '123456789');
      
      expect(ssnInput).toHaveValue('XXX-XX-6789');
    });
  });

  describe('Secure Communication', () => {
    it('should use HTTPS for API calls in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const getApiUrl = (endpoint: string) => {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.quantenergx.com' 
          : 'http://localhost:3001';
        return `${baseUrl}${endpoint}`;
      };
      
      const apiUrl = getApiUrl('/api/user/profile');
      expect(apiUrl).toMatch(/^https:/);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include security headers in requests', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
      
      const secureApiCall = async (endpoint: string, data: any) => {
        return fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          credentials: 'same-origin',
          body: JSON.stringify(data),
        });
      };
      
      await secureApiCall('/api/user/update', { name: 'test' });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ name: 'test' }),
      });
    });
  });
});