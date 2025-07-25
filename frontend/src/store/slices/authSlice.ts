import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'trader' | 'risk_manager' | 'compliance_officer' | 'administrator' | 'analyst';
  department: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    telegram: boolean;
    channels: string[];
  };
  dashboard: {
    defaultView: string;
    refreshInterval: number;
    widgetLayout: string[];
  };
  trading: {
    defaultCommodity: string;
    autoRefresh: boolean;
    confirmOrders: boolean;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  preferences: UserPreferences | null;
  users: User[];
  loading: {
    auth: boolean;
    users: boolean;
    preferences: boolean;
  };
  error: string | null;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    sms: false,
    whatsapp: false,
    telegram: false,
    channels: ['email'],
  },
  dashboard: {
    defaultView: 'overview',
    refreshInterval: 30,
    widgetLayout: ['prices', 'positions', 'alerts'],
  },
  trading: {
    defaultCommodity: 'crude_oil',
    autoRefresh: true,
    confirmOrders: true,
  },
};

const initialState: AuthState = {
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  preferences: null,
  users: [],
  loading: {
    auth: false,
    users: false,
    preferences: false,
  },
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async () => {
    const response = await fetch('/api/v1/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates: Partial<User>) => {
    const response = await fetch('/api/v1/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    return response.json();
  }
);

export const fetchUserPreferences = createAsyncThunk(
  'auth/fetchUserPreferences',
  async () => {
    const response = await fetch('/api/v1/auth/preferences', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    
    return response.json();
  }
);

export const updateUserPreferences = createAsyncThunk(
  'auth/updateUserPreferences',
  async (preferences: Partial<UserPreferences>) => {
    const response = await fetch('/api/v1/auth/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(preferences),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
    
    return response.json();
  }
);

export const fetchAllUsers = createAsyncThunk(
  'auth/fetchAllUsers',
  async ({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) => {
    const response = await fetch(`/api/v1/auth/users?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  }
);

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>) => {
    const response = await fetch('/api/v1/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    return response.json();
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    const response = await fetch(`/api/v1/auth/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    return response.json();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.preferences = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    updatePreferencesLocal: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = { ...state.preferences, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading.auth = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading.auth = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading.auth = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.preferences = null;
      })
      // Fetch user profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      // Update user profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      // Fetch preferences
      .addCase(fetchUserPreferences.pending, (state) => {
        state.loading.preferences = true;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.loading.preferences = false;
        state.preferences = action.payload.preferences || defaultPreferences;
      })
      .addCase(fetchUserPreferences.rejected, (state) => {
        state.loading.preferences = false;
        state.preferences = defaultPreferences;
      })
      // Update preferences
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload.preferences;
      })
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading.users = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload.users;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Create user
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload.user);
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.user.id);
        if (index !== -1) {
          state.users[index] = action.payload.user;
        }
      });
  },
});

export const { clearError, setToken, clearAuth, updatePreferencesLocal } = authSlice.actions;
export default authSlice.reducer;