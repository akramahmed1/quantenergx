import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, clearError, setToken } from '../store/slices/authSlice';

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('authSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.user).toBe(null);
    expect(state.loading.auth).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle clearError action', () => {
    // First set an error
    store.dispatch({ type: 'auth/login/rejected', error: { message: 'Login failed' } });
    expect(store.getState().auth.error).toBe('Login failed');

    // Then clear it
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBe(null);
  });

  it('should handle setToken action', () => {
    const token = 'test-token';

    store.dispatch(setToken(token));

    const state = store.getState().auth;
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
  });

  it('should handle login pending', () => {
    store.dispatch({ type: login.pending.type });

    const state = store.getState().auth;
    expect(state.loading.auth).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle login fulfilled', () => {
    const loginData = {
      token: 'test-token',
      refreshToken: 'refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'trader' as const,
        department: 'Trading',
        permissions: ['trade'],
        status: 'active' as const,
        lastLogin: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    store.dispatch({
      type: login.fulfilled.type,
      payload: loginData,
    });

    const state = store.getState().auth;
    expect(state.loading.auth).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(loginData.token);
    expect(state.refreshToken).toBe(loginData.refreshToken);
    expect(state.user).toEqual(loginData.user);
  });

  it('should handle login rejected', () => {
    const errorMessage = 'Invalid credentials';

    store.dispatch({
      type: login.rejected.type,
      error: { message: errorMessage },
    });

    const state = store.getState().auth;
    expect(state.loading.auth).toBe(false);
    expect(state.error).toBe(errorMessage);
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle logout fulfilled', () => {
    // First login
    store.dispatch(setToken('test-token'));
    expect(store.getState().auth.isAuthenticated).toBe(true);

    // Then logout
    store.dispatch({ type: logout.fulfilled.type });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.refreshToken).toBe(null);
    expect(state.user).toBe(null);
    expect(state.preferences).toBe(null);
  });

  it('should handle fetchUserProfile fulfilled', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'trader' as const,
      department: 'Trading',
      permissions: ['trade'],
      status: 'active' as const,
      lastLogin: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    store.dispatch({
      type: 'auth/fetchUserProfile/fulfilled',
      payload: { user },
    });

    const state = store.getState().auth;
    expect(state.user).toEqual(user);
  });
});
