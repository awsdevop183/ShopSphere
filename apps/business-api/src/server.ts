import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
app.listen(config.port, config.host, () => {
  // Bind to localhost by default; LAN exposure requires explicit BIND_HOST.
  console.log(`ShopSphere API on http://${config.host}:${config.port}  (labs ${config.labsEnabled ? 'ENABLED' : 'disabled'})`);
});
