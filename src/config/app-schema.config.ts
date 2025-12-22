import Joi from 'joi';

export const appSchemaConfig = Joi.object({
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SYNC: Joi.number().valid(0, 1).required(),
  JWT_TOKEN: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
});
