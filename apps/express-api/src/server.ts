import app from './index';

// Pino
import logger from './lib/logger';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`);
});
