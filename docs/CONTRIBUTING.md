# Contributing to QuantEnergx

Welcome to the QuantEnergx project! This guide will help you get started with contributing to our energy trading platform.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- Git
- PostgreSQL (for local development)
- Redis (for caching)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/akramahmed1/quantenergx.git
   cd quantenergx
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit the .env files with your local configuration
   ```

4. **Start local services with Docker**
   ```bash
   # Start PostgreSQL, Redis, and other services
   docker-compose up -d
   ```

5. **Run the application**
   ```bash
   # Start backend (runs on port 3001)
   make dev-backend
   
   # Start frontend (runs on port 3000)
   make dev-frontend
   
   # Or start both with
   make dev
   ```

## 🛠️ Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `hotfix/*`: Critical bug fixes
- `release/*`: Release preparation branches

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run all tests
   make test
   
   # Run linting
   make lint
   
   # Run security checks
   make security-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format
We use conventional commits for automated changelog generation:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
- `feat(trading): add real-time price alerts`
- `fix(auth): resolve JWT token expiration issue`
- `docs(api): update authentication endpoints`

## 📋 Coding Standards

### Backend (Node.js/TypeScript)

#### File Structure
```
backend/src/
├── controllers/     # Request handlers
├── services/       # Business logic
├── models/         # Database models
├── middleware/     # Express middleware
├── routes/         # API route definitions
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── tests/          # Test files
```

#### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Implement proper error handling
- Use async/await for asynchronous operations

```typescript
// Good example
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await userService.findById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ data: user });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Frontend (React/TypeScript)

#### Component Structure
```
frontend/src/
├── components/     # Reusable components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API services
├── store/          # Redux store
├── types/          # TypeScript types
├── utils/          # Utility functions
└── tests/          # Test files
```

#### Code Style
- Use functional components with hooks
- Implement proper prop types
- Use custom hooks for reusable logic
- Follow Material-UI design patterns

```tsx
// Good example
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getProfile(userId);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage message="User not found" />;
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{user.name}</Typography>
        <Typography color="textSecondary">{user.email}</Typography>
      </CardContent>
    </Card>
  );
};
```

### Database

#### Migration Files
- Use descriptive names for migrations
- Include both up and down migrations
- Test migrations on sample data

#### Schema Design
- Use consistent naming conventions
- Add appropriate indexes
- Include foreign key constraints
- Document complex relationships

## 🧪 Testing Guidelines

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Achieve minimum 80% code coverage
- Use descriptive test names

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createdUser = await userService.createUser(userData);
      
      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
    });
    
    it('should throw error with invalid email', async () => {
      const userData = { name: 'John Doe', email: 'invalid-email' };
      
      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email');
    });
  });
});
```

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Clean up after each test

### E2E Tests
- Test critical user flows
- Use Cypress for browser automation
- Run against staging environment

## 🔒 Security Guidelines

### Code Security
- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

### API Security
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs
- Implement proper authentication

### Data Security
- Encrypt sensitive data at rest
- Use parameterized queries
- Implement access controls
- Log security events

## 📝 Documentation

### Code Documentation
- Document complex business logic
- Use JSDoc for function documentation
- Keep README files up to date
- Document API changes

### API Documentation
- Use OpenAPI/Swagger specification
- Include request/response examples
- Document error codes
- Keep documentation in sync with code

## 🚀 Deployment

### Environment Promotion
1. **Development**: Local development environment
2. **Staging**: Pre-production testing environment
3. **Production**: Live production environment

### CI/CD Pipeline
- All changes must pass CI checks
- Automated testing on all pull requests
- Automated deployment to staging
- Manual approval for production deployment

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Request Reviews**: Code review discussions

### Code Review Process
1. Create pull request with clear description
2. Ensure all CI checks pass
3. Request review from team members
4. Address feedback and update code
5. Get approval from maintainers
6. Merge after all checks pass

## 🎯 Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority:high`: High priority issues
- `priority:medium`: Medium priority issues
- `priority:low`: Low priority issues

## 📄 License

By contributing to QuantEnergx, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to QuantEnergx! 🙏