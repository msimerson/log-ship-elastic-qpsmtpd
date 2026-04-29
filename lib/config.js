'use strict';

// node built-ins
const fs = require('node:fs');
const path = require('node:path');

// npm modules
const ini = require('ini');

// local modules
const logger = require('./logger');

function loadConfig (etcDir) {
  const file = 'log-ship-elastic-qpsmtpd.ini';
  const candidates = new Set();
  if (etcDir) candidates.add(path.resolve(etcDir, file));
  candidates.add(path.resolve('/etc', file));
  candidates.add(path.resolve('./', file));

  // first one that is readable wins
  for (const filePath of candidates) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return ini.parse(data);
    }
    catch (err) {
      logger.error(err.message);
    }
  }

  throw new Error('No configuration file found in any candidate location');
}

module.exports = (etcDir) => loadConfig(etcDir);
