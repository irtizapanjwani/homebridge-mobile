// Vercel serverless function that runs the app's API routes (src/app/api/**/+api.ts) and serves
// the web pages. Static files (JS, fonts, images) are served by Vercel straight from dist/client.
const path = require('path');
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: path.join(__dirname, '../dist/server'),
});
