import { generateUser } from './utils/generate-user';
import { TestUser } from './test-user.model';
import { TestSetup } from './utils/test-setup';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let testSetup: TestSetup;
  let testUser: TestUser;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
    testUser = generateUser();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });
});
