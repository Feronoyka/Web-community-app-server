const generateRandomName = (length = 6) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const generateUser = () => ({
  domainName: generateRandomName(),
  username: 'Alisher',
  email: `user${Date.now()}@test.com`,
  password: 'Password123',
});
