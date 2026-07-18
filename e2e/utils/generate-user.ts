const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz123456789';

const randomString = (length = 6): string => {
  let value = '';

  for (let index = 0; index < length; index++) {
    value += ALPHANUMERIC.charAt(
      Math.floor(Math.random() * ALPHANUMERIC.length),
    );
  }

  return value;
};

export const generateUser = () => ({
  nickname: randomString(8),
  username: randomString(8),
  email: `user-${Date.now()}-${randomString(4)}@test.com`,
  password: 'Password123$',
});
