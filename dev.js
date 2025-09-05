import 'dotenv/config';
import app from './backend/src/app.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API local en http://localhost:${PORT}`);
});
