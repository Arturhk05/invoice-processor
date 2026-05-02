import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  RABBITMQ_URL: Joi.string().uri().required(),

  THROTTLE_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),
  THROTTLE_LOGIN_LIMIT: Joi.number().integer().positive().default(5),
  THROTTLE_REFRESH_LIMIT: Joi.number().integer().positive().default(10),

  INGESTION_SERVICE_URL: Joi.string().uri().required(),
  PROXY_TIMEOUT_MS: Joi.number().integer().positive().default(5000),
  INGESTION_INTERNAL_TOKEN: Joi.string().required().min(32),
});
