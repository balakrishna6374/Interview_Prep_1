const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Question = require('../models/Question');

let token;
let adminToken;
let testUserId;
let testQuestionId;

beforeAll(async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@interviewprep.com', password: 'user123' });

  if (loginResponse.body?.data?.id) {
    testUserId = loginResponse.body.data.id;
  }

  token = loginResponse.headers['set-cookie']
    ? loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1]
    : null;

  const adminResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@interviewprep.com', password: 'admin123' });

  adminToken = adminResponse.headers['set-cookie']
    ? adminResponse.headers['set-cookie'][0].split(';')[0].split('=')[1]
    : null;
});

afterAll(async () => {
  try {
    await User.deleteMany({});
    await Question.deleteMany({});
  } catch (err) {}
});

describe('Auth Routes', () => {
  test('POST /api/auth/register - should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User New',
        email: 'newuser@test.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/login - should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@interviewprep.com', password: 'user123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/login - should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@interviewprep.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/auth/me - should get current user profile', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/auth/me - should reject unauthenticated request', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});

describe('Question Routes', () => {
  test('GET /api/questions - should get all questions', async () => {
    const response = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/questions - should filter by category', async () => {
    const response = await request(app)
      .get('/api/questions?category=Technical')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('GET /api/questions - should filter by difficulty', async () => {
    const response = await request(app)
      .get('/api/questions?difficulty=Easy')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('POST /api/questions - should create a question', async () => {
    const response = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Question',
        description: 'Test Description',
        category: 'Technical',
        difficulty: 'Easy',
        keywords: ['test', 'keyword']
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    testQuestionId = response.body.data._id;
  });

  test('GET /api/questions/:id - should get a single question', async () => {
    const response = await request(app)
      .get(`/api/questions/${testQuestionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('PUT /api/questions/:id - should update a question', async () => {
    const response = await request(app)
      .put(`/api/questions/${testQuestionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Test Question' });

    expect(response.status).toBe(200);
  });

  test('POST /api/questions/:id/save - should save a question', async () => {
    const response = await request(app)
      .post(`/api/questions/${testQuestionId}/save`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('POST /api/questions/:id/complete - should mark question complete', async () => {
    const response = await request(app)
      .post(`/api/questions/${testQuestionId}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('DELETE /api/questions/:id - should delete a question', async () => {
    const response = await request(app)
      .delete(`/api/questions/${testQuestionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});

describe('Attempt Routes', () => {
  let questionId;

  beforeAll(async () => {
    const q = await Question.create({
      title: 'Test Attempt Question',
      description: 'Test Description',
      category: 'Technical',
      difficulty: 'Easy',
      keywords: ['test']
    });
    questionId = q._id;
  });

  test('POST /api/attempts/submit - should submit an answer', async () => {
    const response = await request(app)
      .post('/api/attempts/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: questionId,
        answer: 'This is a test answer with some keywords',
        timeSpent: 120
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/attempts - should get user attempts', async () => {
    const response = await request(app)
      .get('/api/attempts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('GET /api/attempts/analytics - should get user analytics', async () => {
    const response = await request(app)
      .get('/api/attempts/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});

describe('Admin Routes', () => {
  test('GET /api/admin/users - should get all users (admin only)', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('GET /api/admin/users - should reject non-admin', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  test('GET /api/admin/analytics - should get system analytics', async () => {
    const response = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});

describe('Health Check', () => {
  test('GET /api/health - should return OK', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});