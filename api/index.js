// api/index.js
import serverless from 'serverless-http';
import app from '../backend/src/app.js';

// Export default para que Vercel lo detecte como función serverless
export default serverless(app);
