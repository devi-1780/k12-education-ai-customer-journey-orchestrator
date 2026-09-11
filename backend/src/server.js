import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

let server;

async function start() {
  await connectDB();
  server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[SERVER] Listening on port ${env.port} (${env.nodeEnv})`);
  });
}

function shutdown(signal) {
  return () => {
    // eslint-disable-next-line no-console
    console.log(`[SERVER] Received ${signal}, shutting down gracefully...`);
    if (server) {
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log('[SERVER] Closed remaining connections.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    } else {
      process.exit(0);
    }
  };
}

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[SERVER] Failed to start:', err);
  process.exit(1);
});
