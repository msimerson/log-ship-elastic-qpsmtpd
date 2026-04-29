'use strict';

const assert = require('node:assert/strict');
const { describe, it, beforeEach, afterEach } = require('node:test');

const logger = require('../lib/logger');

describe('logger', () => {

  ['info', 'error', 'debug'].forEach((level) => {
    it(`has ${level} function`, () => {
      assert.strictEqual(typeof logger[level], 'function');
    });
  });

  describe('emits log entries', () => {
    let consoleLogStub;
    let consoleErrorStub;

    beforeEach(() => {
      consoleLogStub = console.log;
      consoleErrorStub = console.error;
      console.log = () => {};
      console.error = () => {};
    });

    afterEach(() => {
      console.log = consoleLogStub;
      console.error = consoleErrorStub;
      delete process.env.DEBUG;
      process.env.NODE_ENV = 'test';
    });

    it('debug outputs when DEBUG is set', () => {
      let debugCalled = false;
      console.log = () => { debugCalled = true; };
      process.env.DEBUG = '1';
      logger.debug('test debug');
      assert.strictEqual(debugCalled, true);
    });

    it('debug does not output when DEBUG is not set', () => {
      let debugCalled = false;
      console.log = () => { debugCalled = true; };
      delete process.env.DEBUG;
      logger.debug('test debug');
      assert.strictEqual(debugCalled, false);
    });

    it('info does not output in test environment', () => {
      let infoCalled = false;
      console.log = () => { infoCalled = true; };
      process.env.NODE_ENV = 'test';
      logger.info('test info');
      assert.strictEqual(infoCalled, false);
    });

    it('info outputs outside test environment', () => {
      let infoCalled = false;
      console.log = () => { infoCalled = true; };
      process.env.NODE_ENV = 'production';
      logger.info('test info');
      assert.strictEqual(infoCalled, true);
    });

    it('error does not output in test environment', () => {
      let errorCalled = false;
      console.error = () => { errorCalled = true; };
      process.env.NODE_ENV = 'test';
      logger.error('test error');
      assert.strictEqual(errorCalled, false);
    });

    it('error outputs outside test environment', () => {
      let errorCalled = false;
      console.error = () => { errorCalled = true; };
      process.env.NODE_ENV = 'production';
      logger.error('test error');
      assert.strictEqual(errorCalled, true);
    });
  });
});
