import { configureStore } from '@reduxjs/toolkit';
import notificationSlice, {
  addNotification,
  removeNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setNotificationSettings,
  initialState,
} from '../store/slices/notificationSlice';

describe('notificationSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        notifications: notificationSlice,
      },
    });
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().notifications;

      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.settings).toEqual({
        email: true,
        push: true,
        sms: false,
        inApp: true,
        sound: true,
        trading: true,
        security: true,
        system: true,
        marketing: false,
      });
    });
  });

  describe('addNotification action', () => {
    test('should add notification to the list', () => {
      const notification = {
        id: 'notif-1',
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
        timestamp: new Date().toISOString(),
        read: false,
      };

      const action = addNotification(notification);
      const state = notificationSlice(initialState, action);

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toEqual(notification);
      expect(state.unreadCount).toBe(1);
    });

    test('should add notification with auto-generated ID if not provided', () => {
      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully',
        timestamp: new Date().toISOString(),
        read: false,
      };

      const action = addNotification(notification);
      const state = notificationSlice(initialState, action);

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBeDefined();
      expect(typeof state.notifications[0].id).toBe('string');
    });

    test('should add multiple notifications and maintain order', () => {
      let state = initialState;

      const notification1 = {
        id: 'notif-1',
        type: 'info' as const,
        title: 'First Notification',
        message: 'First message',
        timestamp: '2023-01-01T10:00:00Z',
        read: false,
      };

      const notification2 = {
        id: 'notif-2',
        type: 'warning' as const,
        title: 'Second Notification',
        message: 'Second message',
        timestamp: '2023-01-01T11:00:00Z',
        read: false,
      };

      state = notificationSlice(state, addNotification(notification1));
      state = notificationSlice(state, addNotification(notification2));

      expect(state.notifications).toHaveLength(2);
      expect(state.unreadCount).toBe(2);
      // Most recent should be first
      expect(state.notifications[0].id).toBe('notif-2');
      expect(state.notifications[1].id).toBe('notif-1');
    });
  });

  describe('removeNotification action', () => {
    test('should remove notification by ID', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'First',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
          {
            id: 'notif-2',
            type: 'warning' as const,
            title: 'Second',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ],
        unreadCount: 1,
      };

      const action = removeNotification('notif-1');
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('notif-2');
      expect(state.unreadCount).toBe(0); // Removed unread notification
    });

    test('should not affect state when removing non-existent notification', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'Test',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
        unreadCount: 1,
      };

      const action = removeNotification('non-existent');
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAsRead action', () => {
    test('should mark notification as read', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'Test',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
        unreadCount: 1,
      };

      const action = markAsRead('notif-1');
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    test('should not change unread count if notification already read', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'Test',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ],
        unreadCount: 0,
      };

      const action = markAsRead('notif-1');
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead action', () => {
    test('should mark all notifications as read', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'First',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
          {
            id: 'notif-2',
            type: 'warning' as const,
            title: 'Second',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
          {
            id: 'notif-3',
            type: 'error' as const,
            title: 'Third',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: true,
          },
        ],
        unreadCount: 2,
      };

      const action = markAllAsRead();
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications.every(n => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('clearNotifications action', () => {
    test('should clear all notifications', () => {
      const initialStateWithNotifications = {
        ...initialState,
        notifications: [
          {
            id: 'notif-1',
            type: 'info' as const,
            title: 'Test',
            message: 'Message',
            timestamp: new Date().toISOString(),
            read: false,
          },
        ],
        unreadCount: 1,
      };

      const action = clearNotifications();
      const state = notificationSlice(initialStateWithNotifications, action);

      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('setNotificationSettings action', () => {
    test('should update notification settings', () => {
      const newSettings = {
        email: false,
        push: true,
        sms: true,
        inApp: false,
        sound: false,
        trading: true,
        security: true,
        system: false,
        marketing: true,
      };

      const action = setNotificationSettings(newSettings);
      const state = notificationSlice(initialState, action);

      expect(state.settings).toEqual(newSettings);
    });

    test('should partially update notification settings', () => {
      const partialSettings = {
        email: false,
        trading: false,
      };

      const action = setNotificationSettings(partialSettings);
      const state = notificationSlice(initialState, action);

      expect(state.settings.email).toBe(false);
      expect(state.settings.trading).toBe(false);
      // Other settings should remain unchanged
      expect(state.settings.push).toBe(true);
      expect(state.settings.security).toBe(true);
    });
  });

  describe('notification types and categories', () => {
    test('should handle different notification types', () => {
      const notificationTypes = [
        { type: 'info' as const, title: 'Info Notification' },
        { type: 'success' as const, title: 'Success Notification' },
        { type: 'warning' as const, title: 'Warning Notification' },
        { type: 'error' as const, title: 'Error Notification' },
      ];

      let state = initialState;

      notificationTypes.forEach((notif, index) => {
        const notification = {
          id: `notif-${index}`,
          type: notif.type,
          title: notif.title,
          message: 'Test message',
          timestamp: new Date().toISOString(),
          read: false,
        };

        state = notificationSlice(state, addNotification(notification));
      });

      expect(state.notifications).toHaveLength(4);
      expect(state.notifications.map(n => n.type)).toEqual(['error', 'warning', 'success', 'info']);
    });

    test('should handle priority notifications', () => {
      const highPriorityNotification = {
        id: 'urgent-1',
        type: 'error' as const,
        title: 'Critical Security Alert',
        message: 'Suspicious login detected',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high' as const,
        category: 'security' as const,
      };

      const regularNotification = {
        id: 'regular-1',
        type: 'info' as const,
        title: 'Market Update',
        message: 'Oil prices updated',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'normal' as const,
        category: 'trading' as const,
      };

      let state = initialState;
      state = notificationSlice(state, addNotification(regularNotification));
      state = notificationSlice(state, addNotification(highPriorityNotification));

      expect(state.notifications).toHaveLength(2);
      // High priority should be first
      expect(state.notifications[0].priority).toBe('high');
      expect(state.notifications[0].category).toBe('security');
    });
  });

  describe('notification persistence and limits', () => {
    test('should limit number of notifications', () => {
      let state = initialState;

      // Add more notifications than the limit (assuming limit is 100)
      for (let i = 0; i < 105; i++) {
        const notification = {
          id: `notif-${i}`,
          type: 'info' as const,
          title: `Notification ${i}`,
          message: 'Test message',
          timestamp: new Date().toISOString(),
          read: false,
        };

        state = notificationSlice(state, addNotification(notification));
      }

      // Should not exceed reasonable limit
      expect(state.notifications.length).toBeLessThanOrEqual(100);
    });

    test('should handle timestamp-based filtering', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const notifications = [
        {
          id: 'recent',
          type: 'info' as const,
          title: 'Recent',
          message: 'Recent notification',
          timestamp: now.toISOString(),
          read: false,
        },
        {
          id: 'hour-old',
          type: 'info' as const,
          title: 'Hour Old',
          message: 'Hour old notification',
          timestamp: oneHourAgo.toISOString(),
          read: false,
        },
        {
          id: 'day-old',
          type: 'info' as const,
          title: 'Day Old',
          message: 'Day old notification',
          timestamp: oneDayAgo.toISOString(),
          read: false,
        },
      ];

      let state = initialState;
      notifications.forEach(notif => {
        state = notificationSlice(state, addNotification(notif));
      });

      expect(state.notifications).toHaveLength(3);

      // Test filtering by recency (most recent first)
      const timestamps = state.notifications.map(n => new Date(n.timestamp).getTime());
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
      expect(timestamps[1]).toBeGreaterThanOrEqual(timestamps[2]);
    });
  });
});
