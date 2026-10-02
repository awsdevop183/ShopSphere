import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.BIND_HOST ?? '127.0.0.1',
  jwtSecret: process.env.SESSION_JWT_SECRET ?? 'dev-insecure-secret',
  storefrontOrigin: process.env.STOREFRONT_ORIGIN ?? 'http://127.0.0.1:5173',
  labsEnabled: (process.env.LABS_ENABLED ?? 'true') === 'true',
  isProd: process.env.NODE_ENV === 'production',
};
