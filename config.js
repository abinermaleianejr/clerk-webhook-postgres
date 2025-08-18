require('dotenv').config();

module.exports = {
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 3000,
  env: process.env.APP_ENV || 'development'
};