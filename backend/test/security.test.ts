import { Request, Response } from 'express';
import { SecurityMiddleware } from '../src/middleware/security';

// Simple test to verify security middleware functionality
describe('SecurityMiddleware', () => {
  let securityMiddleware: SecurityMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();
    mockReq = {
      get: jest.fn(),
      secure: false,
      path: '/api/test',
    };
    mockRes = {
      setHeader: jest.fn(),
      redirect: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  test('setSecurityHeaders sets all required security headers', () => {
    securityMiddleware.setSecurityHeaders(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cross-Origin-Embedder-Policy', 'require-corp');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cross-Origin-Opener-Policy', 'same-origin');
    expect(nextFunction).toHaveBeenCalled();
  });

  test('enforceHttps redirects HTTP traffic in production', () => {
    const prodSecurityMiddleware = new SecurityMiddleware({ enforceHttps: true });
    mockReq.secure = false;
    (mockReq.get as jest.Mock).mockReturnValue('http');

    prodSecurityMiddleware.enforceHttps(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.redirect).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('setRegionalHeaders adds region-specific headers', () => {
    mockReq.get = jest.fn().mockReturnValue('bahrain.quantenergx.com');

    securityMiddleware.setRegionalHeaders(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-CBB-Compliance', 'enabled');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Trading-Region', 'bahrain');
    expect(nextFunction).toHaveBeenCalled();
  });
});