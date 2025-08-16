import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'test@example.com');
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('/auth/login (POST) - should login a user and return a JWT', async () => {
    // First, ensure the user exists (from previous register test or create a new one)
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(201);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('/listings (POST) - should not allow creating a listing without JWT', () => {
    return request(app.getHttpServer())
      .post('/listings')
      .send({ title: 'Test Listing', price: 100, location: 'Test City' })
      .expect(401); // Unauthorized
  });

  it('/listings (POST) - should allow creating a listing with valid JWT (admin role)', async () => {
    // Register and login an admin user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin',
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'adminpassword' })
      .expect(200);

    const accessToken = loginRes.body.access_token;

    return request(app.getHttpServer())
      .post('/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Admin Listing', price: 200, location: 'Admin City' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('title', 'Admin Listing');
      });
  });
});
