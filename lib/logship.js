'use strict';

// node built-ins
const assert = require('node:assert');
const path = require('node:path');
const util = require('node:util');

// npm modules
const moment = require('moment-timezone');

// local modules
const config = require('./config');
const logger = require('./logger');
const spool = require('./spool');
const ES = require('./elastic');

class QpsmtpdToElastic {
  constructor (etcDir, testMode = false) {
    this.cfg = config(etcDir);
    assert.ok(this.cfg);

    this.batchDelay = this.cfg.reader.batchDelay || 0;

    this.spool = this.cfg.main.spool || '/var/spool/log_ship/qpsmtpd';
    if (process.env.NODE_ENV === 'test') {
      this.spool = path.resolve('./test', 'spool');
    }
    spool.isValidDir(this.spool); // initialize spool dir

    if (!testMode) {
      this.watchdog();

      // initialize Elasticsearch
      this.elastic = ES.getElastic(this.cfg.elastic);
      this.elasticAlive = false;

      const readerOpts = {
        batchLimit: this.cfg.reader.batchLimit || 0,
        bookmark: { dir: path.resolve(this.spool, '.bookmark') },
        watchDelay: this.cfg.reader.watchDelay,
      };

      this.queue = [];
      this.queueActive = false; // true while ES save in progress

      this.elastic.ping((err) => {
        if (err) {
          logger.error(err);
          return;
        }

        this.elasticAlive = true;

        // elasticsearch is up, start reading lines
        const read = require(this.cfg.reader.module);
        this.reader = read.createReader(this.cfg.reader.file, readerOpts)
          .on('read', (data, lineCount) => {
            logger.debug(lineCount); //  + ': ' + data);
            try {
              this.queue.push(JSON.parse(data));
            }
            catch (e) {
              logger.error(e);
              logger.error('encountered while trying to parse: ');
              logger.error(data);
            }
          })
          .on('drain', (done) => {
            // logger.info('\tdrain: ' + this.queue.length);
            this.saveToEs(done);
          })
          .on('end', () => {
            logger.debug('end of file');
          });
      });
    }
  }

  saveToEs (done) {
    if (this.queueActive === true) {
      return done('queue already active!');
    }

    if (this.queue.length === 0) {
      logger.info('queue empty');
      return done(null);
    }

    this.queueActive = true;

    // assemble the ES bulk request
    const esBulk = []; // index, create, update

    for (let i = 0; i < this.queue.length; i++) {
      const data = this.queue.shift();
      const meta = {
        _index: this.getIndexName(data.timestamp),
        _type: this.cfg.elastic.type,
      };
      if (data.id) {
        meta._id = data.id;
      }
      else if (data.uuid) {
        meta._id = data.uuid;
      }

      esBulk.push({ index: meta }, data);
    }

    // save the data to ES
    const bulkDone = (err, res) => {
      // TODO: maybe better error handling (retry, for some errors)
      if (err) return done(err);
      if (res.errors) {
        logger.info(util.inspect(res, { depth: null }));
        return done('bulk errors, see logs');
      }

      // the data is successfully saved
      this.watchdog();
      this.queueActive = false;
      done(null, 1);
    };
    this.elastic.bulk({ body: esBulk, consistency: 'all' }, bulkDone);
  }

  getIndexName (dateInput) {
    let name = this.cfg.elastic.index || 'qpsmtpd';
    if (!/-(?:YYYY|MM|DD)/.test(name)) return name;

    // handle both Date objects and timestamps
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date input: ${dateInput}`);
    }

    // http://momentjs.com/docs/#/get-set/get/
    const m = moment(date);

    name = name.replace(/-YYYY/, `-${m.format('YYYY')}`);
    name = name.replace(/-MM/, `-${m.format('MM')}`);
    name = name.replace(/-DD/, `-${m.format('DD')}`);

    return name;
  }

  shutdown () {
    logger.info('starting graceful shutdown');

    process.env.WANTS_SHUTDOWN = 1;

    if (!this.elasticAlive) {
      logger.info('elastic inactive');
      process.exit();
    }

    setTimeout(() => {
      // deadman: if no shut down in 15s, exit unconditionally
      process.exit();
    }, 15 * 1000);

    if (this.queue && this.queue.length) {
      logger.error(`shutting down with ${this.queue.length} messages in queue`);
    }

    const waitForQueue = () => {
      if (!this.queueActive) {
        logger.info('queue inactive, exiting');
        process.exit();
      }
      logger.info('queue active, waiting');
      setTimeout(() => {
        waitForQueue();
      }, 1000);
    };
    waitForQueue();
  }

  watchdog () {
    clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => {
      logger.info('inactive for 1/4 hour, shutting down.');
      this.shutdown();
    }, 15 * 60 * 1000);
  }
}

module.exports = {
  createShipper: (etcDir, testMode = process.env.NODE_ENV === 'test') => new QpsmtpdToElastic(etcDir, testMode)
};
