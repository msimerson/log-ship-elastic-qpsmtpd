'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it, before } = require('node:test');

const spool = require('../lib/spool');

describe('log-ship-elastic-qpsmtpd', () => {

  before(async () => {
    await fs.promises.chmod(path.resolve('test', 'spool', 'nowrite'), 0o555);
  });

  describe('spool', () => {
    const spooldir = path.resolve('./test', 'spool');

    it('spool dir is defined', () => {
      assert.ok(spooldir);
    });

    it('spool dir is writable', async () => {
      return new Promise((resolve, reject) => {
        spool.isWritable(spooldir, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    it('errs if spool dir is not writable', async () => {
      const spoolDir = path.resolve('./test', 'spool', 'nowrite');
      return new Promise((resolve, reject) => {
        spool.isValidDir(spoolDir, (err) => {
          try {
            assert.strictEqual(err.code, 'EACCES');
            resolve();
          }
          catch (e) {
            reject(e);
          }
        });
      });
    });

    it('isValidDir returns true when directory is valid and writable', () => {
      const result = spool.isValidDir(spooldir);
      assert.strictEqual(result, true);
    });

    it('isValidDir creates parent directory if missing', () => {
      const testDir = path.resolve('./test', 'spool', 'test-new-dir', 'subdir');
      const result = spool.isValidDir(testDir);
      assert.strictEqual(result, true);
      assert.strictEqual(spool.isDirectory(testDir), true);
      // Cleanup
      fs.rmSync(path.resolve('./test', 'spool', 'test-new-dir'), { recursive: true });
    });
  });

  describe('fs utilities', () => {
    it('isDirectory reports true for dir', () => {
      assert.strictEqual(
        spool.isDirectory(path.resolve('./test', 'spool')), true);
    });

    it('isDirectory reports false for file', () => {
      const spoolFile = path.resolve('./test', 'spool', 'file');
      assert.strictEqual(spool.isDirectory(spoolFile), false);
    });

    it('isDirectory reports false for nonexistent path', () => {
      const nonexistent = path.resolve('./test', 'spool', 'nonexistent-xyz');
      assert.strictEqual(spool.isDirectory(nonexistent), false);
    });

    it('isWritable reports true for writable dir', () => {
      const spoolDir = path.resolve('./test', 'spool');
      assert.strictEqual(spool.isWritable(spoolDir), true);
    });

    it('isWritable reports false for non-writable dir', () => {
      const spoolDir = path.resolve('./test', 'spool', 'nowrite');
      assert.strictEqual(spool.isWritable(spoolDir), false);
    });
  });
});
