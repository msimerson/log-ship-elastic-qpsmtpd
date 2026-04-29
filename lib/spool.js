'use strict';

const fs = require('node:fs');
const path = require('node:path');

const logger = require('./logger');

exports.isValidDir = function (dir, done) {

  if (!done) {
    if (this.isDirectory(dir) && this.isWritable(dir)) {
      return true;
    }
    if (!this.isDirectory(dir)) {
      const parentDir = path.dirname(dir);
      logger.info(`parent dir: ${parentDir}`);
      if (!this.isDirectory(parentDir)) {
        fs.mkdirSync(parentDir);
      }
      fs.mkdirSync(dir);
    }

    return true;
  }

  this.isDirectory(dir, (err) => {
    if (err) return done(err);
    this.isWritable(dir, (err2) => {
      if (err2) return done(err2);
      done(null, true);
    });
  });
};

exports.isDirectory = function (dir, done) {
  if (!done) {
    let stat;
    try {
      stat = fs.statSync(dir);
    }
    catch {
      // ignore
    }
    if (!stat) return false;
    return stat.isDirectory();
  }

  fs.stat(dir, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // TODO: make this recursive
        logger.info(`mkdir: ${dir}`);
        fs.mkdir(dir, (err2) => {
          if (err2) return done(err2);
          done(null, true);
        });
        return;
      }
      return done(err);
    }
    return done(null, stats.isDirectory());
  });
};

exports.isWritable = function (dir, done) {
  if (!done) {
    try {
      fs.accessSync(dir, fs.constants.W_OK);
    }
    catch {
      return false;
    }
    return true;
  }

  fs.access(dir, fs.constants.W_OK, (err) => {
    if (err) {
      logger.error(`ERROR: spool dir is not writable: ${err.code}`);
      return done(err);
    }
    done(null, true);
  });
};
