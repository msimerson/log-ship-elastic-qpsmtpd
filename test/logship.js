'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const logship = require('../lib/logship');

describe('logship', () => {
  const shipper = logship.createShipper('./test');

  describe('getIndexName', () => {
    it('replaces YYYY, MM, DD with Date object', () => {
      const date = new Date('2023-05-15T12:00:00Z');
      const indexName = shipper.getIndexName(date);
      const expectedPrefix = shipper.cfg.elastic.index.replace(/-YYYY/, '-2023').replace(/-MM/, '-05').replace(/-DD/, '-15');
      assert.strictEqual(indexName, expectedPrefix);
    });

    it('replaces YYYY, MM, DD with ISO string', () => {
      const indexName = shipper.getIndexName('2023-05-15T12:00:00Z');
      const expectedPrefix = shipper.cfg.elastic.index.replace(/-YYYY/, '-2023').replace(/-MM/, '-05').replace(/-DD/, '-15');
      assert.strictEqual(indexName, expectedPrefix);
    });

    it('returns original name if no placeholders', () => {
      shipper.cfg.elastic.index = 'static-index';
      assert.strictEqual(shipper.getIndexName(new Date()), 'static-index');
    });

    it('throws on invalid date', () => {
      shipper.cfg.elastic.index = 'qpsmtpd-YYYY-MM-DD';
      assert.throws(
        () => shipper.getIndexName('invalid-date'),
        { message: /Invalid date input/ }
      );
    });

    it('throws on NaN date', () => {
      assert.throws(
        () => shipper.getIndexName(new Date('invalid')),
        { message: /Invalid date input/ }
      );
    });

    it('handles timestamp number', () => {
      const timestamp = new Date('2023-05-15T12:00:00Z').getTime();
      const indexName = shipper.getIndexName(timestamp);
      const expectedPrefix = shipper.cfg.elastic.index.replace(/-YYYY/, '-2023').replace(/-MM/, '-05').replace(/-DD/, '-15');
      assert.strictEqual(indexName, expectedPrefix);
    });
  });

  describe('shutdown', () => {
    it('sets WANTS_SHUTDOWN environment variable', () => {
      const testShipper = logship.createShipper('./test');
      delete process.env.WANTS_SHUTDOWN;
      testShipper.shutdown();
      assert.strictEqual(process.env.WANTS_SHUTDOWN, '1');
    });
  });
});
