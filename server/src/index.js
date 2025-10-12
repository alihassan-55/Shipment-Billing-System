import 'dotenv/config';
import { createApp } from './app.js';
import { syncModels } from './models/index.js';

const port = Number(process.env.PORT ?? 4000);

const app = createApp();

async function start() {
  try {
    await syncModels();
    app.listen(port, () => {
      console.log(`cms-server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
