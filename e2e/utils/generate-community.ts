const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export const generateCommunity = () => ({
  name: `Community-${randomSuffix()}`,
  description: 'A community created during e2e tests',
});
