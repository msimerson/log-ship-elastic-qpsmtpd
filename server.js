'use strict';

const logger = require('./lib/logger');
const logship = require('./lib/logship');
const shipper = logship.createShipper();

process.on('SIGINT', () => { // Control-C
  logger.info('\nSIGINT received (Ctrl-C)');
  shipper.shutdown();
});

process.on('SIGTERM', () => { // kill $PID
  logger.info('\nSIGTERM received');
  shipper.shutdown();
});
