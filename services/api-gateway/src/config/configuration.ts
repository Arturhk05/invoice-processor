export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT ?? '5', 10),
    refreshLimit: parseInt(process.env.THROTTLE_REFRESH_LIMIT ?? '10', 10),
  },
});
