// src/server.js

// We want to gracefully shutdown our server
const stoppable = require('stoppable');

// Get our logger instance
const logger = require('./logger');

// Get our express app instance
const app = require('./app');

// Get the desired port from the process' environment. Default to `8080`
const port = parseInt(process.env.PORT || '8080', 10);

// Start a server listening on this port
const server = stoppable(
  app.listen(port, () => {
    logger.info(`Server started on port ${port}`);
    if ((process.env.LOG_LEVEL || '').toLowerCase() === 'debug') {
      logger.debug({ env: process.env }, 'process.env');
    }

    console.log('🔴 Server is running and will stay alive...');
    setInterval(() => console.log('💤 still running...'), 5000);
  })
);

// Export our server instance so other parts of our code can access it if necessary.
module.exports = server;
