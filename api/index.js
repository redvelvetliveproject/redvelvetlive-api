// api/index.js
import serverless from 'serverless-http';
import app from '../backend/src/app.js'; // tu app de Express

export default serverless(app);
