'use strict';

const path = require('node:path');

exports.getElastic = (cfg) => {
  if (!cfg || !cfg.module || !cfg.hosts) {
    throw new Error('Invalid elasticsearch config: missing module or hosts');
  }

  const esm = require(cfg.module);

  const opts = {
    hosts: cfg.hosts.split(/[, ]+/),
    log: 'error', // 'trace',
  };

  if (process.env.NODE_ENV === 'test') {
    opts.log = {
      type: 'file',
      path: path.join('test', 'spool', 'es-err.log'),
    };
  }

  return new esm.Client(opts);
};
