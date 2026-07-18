import request, { Response, Test } from 'supertest';
import { TestSetup } from './test-setup';
import { TestUser } from '../model/test-user.model';

export const bearerAuth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Thin HTTP wrapper around auth endpoints used by most e2e suites.
 */
export class AuthClient {
  constructor(private readonly setup: TestSetup) {}

  register(user: TestUser): Test {
    return request(this.setup.getHttpServer())
      .post('/auth/register')
      .send(user);
  }

  login(user: Pick<TestUser, 'email' | 'password'>): Test {
    return request(this.setup.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
  }

  /**
   * Full login flow for untrusted devices:
   * login -> read OTP from mocked mail -> verify-2fa -> access token.
   */
  async loginWith2FA(
    user: Pick<TestUser, 'email' | 'password'>,
  ): Promise<string> {
    const agent = request.agent(this.setup.getHttpServer());

    const loginResponse = await agent
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(201);

    expect(loginResponse.body.requires2FA).toBe(true);

    const otp = this.setup.sentOtps.get(user.email);
    expect(otp).toBeDefined();

    const verifyResponse = await agent
      .post('/auth/verify-2fa')
      .send({ otp, trustDevice: false, purpose: '2fa' })
      .expect(201);

    expect(verifyResponse.body.accessToken).toBeDefined();

    return verifyResponse.body.accessToken as string;
  }

  async registerAndLogin(user: TestUser): Promise<{
    user: TestUser;
    accessToken: string;
    registerResponse: Response;
  }> {
    const registerResponse = await this.register(user).expect(201);
    const accessToken = await this.loginWith2FA(user);

    return { user, accessToken, registerResponse };
  }
}
