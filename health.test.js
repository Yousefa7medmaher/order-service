// health.test.js
import request from 'supertest';
import app from './src/app.js'; // لاحظ إحنا نستورد app فقط

describe('Health Check', () => {
  it('should return 200 and status OK', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.service).toBe('Order Service');
  });
});
