const request = require('supertest');
const app = require('../../app');
const { User, Notification } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Settings Integration Tests', () => {
  let authToken, testUser;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User',
      email: `test${timestamp}@test.com`,
      password: 'password123',
      role: 'user',
      active: true,
      notification_settings: JSON.stringify({
        email: true,
        push: true,
        sms: false,
        account_alerts: true,
        payment_reminders: true,
        security_alerts: true,
        marketing: false
      }),
      preferences: JSON.stringify({
        theme: 'light',
        currency: 'BRL',
        date_format: 'DD/MM/YYYY',
        decimal_places: 2,
        auto_backup: true
      }),
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR'
    });

    // Fazer login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `test${timestamp}@test.com`,
        password: 'password123'
      });
    authToken = loginResponse.body.token;
  });

  describe('GET /api/settings', () => {
    it('should return user settings', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('language');
      expect(response.body).toHaveProperty('email_verified');
      expect(response.body).toHaveProperty('two_factor_enabled');
      
      expect(response.body.notifications.email).toBe(true);
      expect(response.body.preferences.theme).toBe('light');
      expect(response.body.timezone).toBe('America/Sao_Paulo');
      expect(response.body.language).toBe('pt-BR');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/settings');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update user settings', async () => {
      const updateData = {
        notifications: {
          email: false,
          push: true,
          sms: true
        },
        preferences: {
          theme: 'dark',
          currency: 'USD'
        },
        timezone: 'UTC',
        language: 'en-US'
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('updated');
      expect(response.body.updated).toContain('notification_settings');
      expect(response.body.updated).toContain('preferences');
      expect(response.body.updated).toContain('timezone');
      expect(response.body.updated).toContain('language');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({ notifications: { email: false } });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/settings/sessions', () => {
    it('should return user sessions', async () => {
      const response = await request(app)
        .get('/api/settings/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total');
      expect(response.body.sessions).toBeInstanceOf(Array);
      expect(response.body.sessions.length).toBeGreaterThan(0);
      
      const session = response.body.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('device');
      expect(session).toHaveProperty('browser');
      expect(session).toHaveProperty('ip');
      expect(session).toHaveProperty('location');
      expect(session).toHaveProperty('last_activity');
      expect(session).toHaveProperty('is_current');
      expect(session).toHaveProperty('created_at');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/settings/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/settings/sessions/:id', () => {
    it('should delete a specific session', async () => {
      const response = await request(app)
        .delete('/api/settings/sessions/session123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.sessionId).toBe('session123');
    });

    it('should return 400 when trying to delete current session', async () => {
      const response = await request(app)
        .delete('/api/settings/sessions/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/settings/sessions/session123');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/settings/sessions/all', () => {
    it('should delete all sessions except current', async () => {
      const response = await request(app)
        .delete('/api/settings/sessions/all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sessionsClosed');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/settings/sessions/all');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/settings/notifications', () => {
    beforeEach(async () => {
      // Criar algumas notificações de teste
      await Notification.create({
        user_id: testUser.id,
        title: 'Test Notification 1',
        message: 'This is a test notification',
        type: 'system',
        is_read: false
      });

      await Notification.create({
        user_id: testUser.id,
        title: 'Test Notification 2',
        message: 'This is another test notification',
        type: 'system',
        is_read: true
      });
    });

    it('should return user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/settings/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.notifications).toBeInstanceOf(Array);
      expect(response.body.notifications.length).toBeGreaterThan(0);
      
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should filter notifications by read status', async () => {
      const response = await request(app)
        .get('/api/settings/notifications?read=false')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.notifications.every(n => n.is_read === false)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/settings/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/settings/notifications/:id/read', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        user_id: testUser.id,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        is_read: false
      });
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/settings/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('notificationId');
      expect(response.body.notificationId).toBe(testNotification.id);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/settings/notifications/99999/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put(`/api/settings/notifications/${testNotification.id}/read`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/settings/notifications/:id', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await Notification.create({
        user_id: testUser.id,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        is_read: false
      });
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/settings/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('notificationId');
      expect(response.body.notificationId).toBe(testNotification.id);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .delete('/api/settings/notifications/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete(`/api/settings/notifications/${testNotification.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 