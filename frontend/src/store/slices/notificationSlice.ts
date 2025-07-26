import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'trade' | 'risk' | 'compliance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  channel: 'email' | 'sms' | 'whatsapp' | 'telegram' | 'in_app';
  recipient: string;
  data?: any;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'telegram';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationPreferences {
  channels: string[];
  types: {
    trade: boolean;
    risk: boolean;
    compliance: boolean;
    system: boolean;
    marketing: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  frequency: {
    immediate: string[];
    hourly: string[];
    daily: string[];
  };
}

export interface NotificationState {
  notifications: Notification[];
  channels: NotificationChannel[];
  preferences: NotificationPreferences;
  unreadCount: number;
  loading: {
    notifications: boolean;
    channels: boolean;
    sending: boolean;
  };
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  channels: [],
  preferences: {
    channels: ['email'],
    types: {
      trade: true,
      risk: true,
      compliance: true,
      system: true,
      marketing: false,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
    frequency: {
      immediate: ['trade', 'risk', 'compliance'],
      hourly: ['system'],
      daily: ['marketing'],
    },
  },
  unreadCount: 0,
  loading: {
    notifications: false,
    channels: false,
    sending: false,
  },
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({
    page = 1,
    limit = 50,
    unreadOnly = false,
  }: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly && { unread: 'true' }),
    });

    const response = await fetch(`/api/v1/notifications?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds: string | string[]) => {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    const response = await fetch('/api/v1/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ notificationIds: ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }

    return { notificationIds: ids };
  }
);

export const deleteNotifications = createAsyncThunk(
  'notifications/deleteNotifications',
  async (notificationIds: string[]) => {
    const response = await fetch('/api/v1/notifications', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete notifications');
    }

    return { notificationIds };
  }
);

export const sendNotification = createAsyncThunk(
  'notifications/sendNotification',
  async ({
    channel,
    recipient,
    message,
    options,
  }: {
    channel: string;
    recipient: string;
    message: string;
    options?: any;
  }) => {
    const response = await fetch('/api/v1/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        channel,
        recipient,
        message,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return response.json();
  }
);

export const fetchNotificationChannels = createAsyncThunk(
  'notifications/fetchChannels',
  async () => {
    const response = await fetch('/api/v1/notifications/channels', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification channels');
    }

    return response.json();
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences: Partial<NotificationPreferences>) => {
    const response = await fetch('/api/v1/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update notification preferences');
    }

    return response.json();
  }
);

export const testNotification = createAsyncThunk(
  'notifications/testNotification',
  async ({ channel, recipient }: { channel: string; recipient: string }) => {
    const response = await fetch('/api/v1/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        channel,
        recipient,
        message: 'This is a test notification from QuantEnergx',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    return response.json();
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAsReadLocal: (state, action: PayloadAction<string | string[]>) => {
      const ids = Array.isArray(action.payload) ? action.payload : [action.payload];
      ids.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
    },
    markAllAsReadLocal: state => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotifications: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = action.payload;
      const removedUnreadCount = state.notifications.filter(
        n => idsToRemove.includes(n.id) && !n.read
      ).length;

      state.notifications = state.notifications.filter(n => !idsToRemove.includes(n.id));
      state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
    },
    updatePreferencesLocal: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
  },
  extraReducers: builder => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, state => {
        state.loading.notifications = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.notifications = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        notificationIds.forEach(id => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      })
      // Delete notifications
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        const removedUnreadCount = state.notifications.filter(
          n => notificationIds.includes(n.id) && !n.read
        ).length;

        state.notifications = state.notifications.filter(n => !notificationIds.includes(n.id));
        state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
      })
      // Send notification
      .addCase(sendNotification.pending, state => {
        state.loading.sending = true;
        state.error = null;
      })
      .addCase(sendNotification.fulfilled, state => {
        state.loading.sending = false;
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.error.message || 'Failed to send notification';
      })
      // Fetch channels
      .addCase(fetchNotificationChannels.pending, state => {
        state.loading.channels = true;
      })
      .addCase(fetchNotificationChannels.fulfilled, (state, action) => {
        state.loading.channels = false;
        state.channels = action.payload.channels;
      })
      .addCase(fetchNotificationChannels.rejected, (state, action) => {
        state.loading.channels = false;
        state.error = action.error.message || 'Failed to fetch channels';
      })
      // Update preferences
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload.preferences;
      })
      // Test notification
      .addCase(testNotification.pending, state => {
        state.loading.sending = true;
      })
      .addCase(testNotification.fulfilled, state => {
        state.loading.sending = false;
      })
      .addCase(testNotification.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.error.message || 'Failed to send test notification';
      });
  },
});

export const {
  clearError,
  addNotification,
  markAsReadLocal,
  markAllAsReadLocal,
  removeNotifications,
  updatePreferencesLocal,
} = notificationSlice.actions;

export default notificationSlice.reducer;
