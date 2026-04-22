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
  nickname: generateRandomName(),
  username: generateRandomName(),
  email: `user${Date.now()}${generateRandomName(4)}@test.com`,
  password: 'Password123$',
});
