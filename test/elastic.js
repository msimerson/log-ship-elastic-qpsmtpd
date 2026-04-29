'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

describe('elastic', () => {
  const elastic = require('../lib/elastic');

  describe('getElastic', () => {
    it('throws if cfg is missing', () => {
      assert.throws(
        () => elastic.getElastic(null),
        { message: /Invalid elasticsearch config/ }
      );
    });

    it('throws if cfg.module is missing', () => {
      assert.throws(
        () => elastic.getElastic({ hosts: 'localhost:9200' }),
        { message: /Invalid elasticsearch config/ }
      );
    });

    it('throws if cfg.hosts is missing', () => {
      assert.throws(
        () => elastic.getElastic({ module: 'elasticsearch' }),
        { message: /Invalid elasticsearch config/ }
      );
    });

    it('throws if cfg.module cannot be required', () => {
      assert.throws(
        () => elastic.getElastic({
          module: './nonexistent-module',
          hosts: 'localhost:9200'
        }),
        { code: 'MODULE_NOT_FOUND' }
      );
    });

    it('returns client with proper hosts configuration', () => {
      // This test uses the actual elasticsearch module from package.json
      const client = elastic.getElastic({
        module: 'elasticsearch',
        hosts: 'localhost:9200'
      });
      assert.ok(client);
      assert.strictEqual(typeof client.ping, 'function');
    });

    it('splits comma-separated hosts correctly', () => {
      const client = elastic.getElastic({
        module: 'elasticsearch',
        hosts: 'host1:9200, host2:9200, host3:9200'
      });
      assert.ok(client);
      assert.strictEqual(typeof client.ping, 'function');
    });

    it('splits space-separated hosts correctly', () => {
      const client = elastic.getElastic({
        module: 'elasticsearch',
        hosts: 'host1:9200 host2:9200'
      });
      assert.ok(client);
      assert.strictEqual(typeof client.ping, 'function');
    });
  });
});
