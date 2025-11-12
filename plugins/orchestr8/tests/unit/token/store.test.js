/**
 * Unit tests for TokenStore
 * Tests storage, retrieval, session management, and cleanup
 */

import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

let TokenStore;

describe('TokenStore', () => {
  before(async () => {
    const module = await import('../../../dist/token/store.js');
    TokenStore = module.TokenStore;
  });

  let store;

  beforeEach(() => {
    store = new TokenStore({ autoCleanup: false }); // Disable auto-cleanup for tests
  });

  afterEach(() => {
    if (store) {
      store.destroy();
    }
  });

  describe('saveUsage()', () => {
    it('should save usage record', () => {
      const usage = createMockUsage('msg-1');
      store.saveUsage(usage);

      assert.equal(store.getTotalCount(), 1);
    });

    it('should save multiple records', () => {
      store.saveUsage(createMockUsage('msg-1'));
      store.saveUsage(createMockUsage('msg-2'));
      store.saveUsage(createMockUsage('msg-3'));

      assert.equal(store.getTotalCount(), 3);
    });

    it('should create session when sessionId provided', () => {
      const usage = createMockUsage('msg-1');
      store.saveUsage(usage, 'session-1');

      assert.equal(store.getSessionCount(), 1);

      const session = store.getSessionData('session-1');
      assert.ok(session);
      assert.equal(session.sessionId, 'session-1');
      assert.equal(session.messageCount, 1);
    });

    it('should update existing session', () => {
      store.saveUsage(createMockUsage('msg-1', 1000), 'session-1');
      store.saveUsage(createMockUsage('msg-2', 2000), 'session-1');

      const session = store.getSessionData('session-1');
      assert.equal(session.messageCount, 2);
      assert.equal(session.totalTokens, 3000);
    });

    it('should enforce max records limit', () => {
      const limitedStore = new TokenStore({ maxRecords: 5, autoCleanup: false });

      for (let i = 0; i < 10; i++) {
        limitedStore.saveUsage(createMockUsage(`msg-${i}`));
      }

      assert.equal(limitedStore.getTotalCount(), 5);
      limitedStore.destroy();
    });
  });

  describe('getRecentUsage()', () => {
    beforeEach(() => {
      // Add test data with different timestamps
      for (let i = 0; i < 5; i++) {
        const usage = createMockUsage(`msg-${i}`);
        usage.timestamp = new Date(Date.now() - i * 1000); // Each 1 second apart
        store.saveUsage(usage);
      }
    });

    it('should return recent records', () => {
      const recent = store.getRecentUsage(3);

      assert.equal(recent.length, 3);
      // Should be sorted newest first
      assert.equal(recent[0].messageId, 'msg-0');
      assert.equal(recent[1].messageId, 'msg-1');
      assert.equal(recent[2].messageId, 'msg-2');
    });

    it('should filter by category', () => {
      store.saveUsage({ ...createMockUsage('msg-agents-1'), category: 'agents' });
      store.saveUsage({ ...createMockUsage('msg-skills-1'), category: 'skills' });

      const agentRecords = store.getRecentUsage(100, 'agents');
      const skillRecords = store.getRecentUsage(100, 'skills');

      assert.equal(agentRecords.length, 1);
      assert.equal(skillRecords.length, 1);
      assert.equal(agentRecords[0].category, 'agents');
      assert.equal(skillRecords[0].category, 'skills');
    });

    it('should respect limit parameter', () => {
      const recent = store.getRecentUsage(2);
      assert.equal(recent.length, 2);
    });
  });

  describe('getUsageInRange()', () => {
    beforeEach(() => {
      const now = Date.now();
      // Add records at different times
      for (let i = 0; i < 5; i++) {
        const usage = createMockUsage(`msg-${i}`);
        usage.timestamp = new Date(now - i * 24 * 60 * 60 * 1000); // Each 1 day apart
        store.saveUsage(usage);
      }
    });

    it('should return records in time range', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const records = store.getUsageInRange(twoDaysAgo, now);

      // Should include today, yesterday, and 2 days ago = 3 records
      assert.ok(records.length >= 2 && records.length <= 3);
    });

    it('should filter by category in range', () => {
      const usage = createMockUsage('msg-category');
      usage.category = 'agents';
      usage.timestamp = new Date();
      store.saveUsage(usage);

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const records = store.getUsageInRange(yesterday, now, 'agents');

      assert.equal(records.length, 1);
      assert.equal(records[0].category, 'agents');
    });

    it('should return empty array for range with no records', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const farFuture = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const records = store.getUsageInRange(future, farFuture);

      assert.equal(records.length, 0);
    });
  });

  describe('session management', () => {
    it('should get session data', () => {
      store.saveUsage(createMockUsage('msg-1'), 'session-1');

      const session = store.getSessionData('session-1');

      assert.ok(session);
      assert.equal(session.sessionId, 'session-1');
      assert.ok(session.startTime instanceof Date);
      assert.equal(session.endTime, undefined);
    });

    it('should return undefined for non-existent session', () => {
      const session = store.getSessionData('non-existent');
      assert.equal(session, undefined);
    });

    it('should get all sessions', () => {
      store.saveUsage(createMockUsage('msg-1'), 'session-1');
      store.saveUsage(createMockUsage('msg-2'), 'session-2');

      const sessions = store.getAllSessions();

      assert.equal(sessions.length, 2);
    });

    it('should end session', () => {
      store.saveUsage(createMockUsage('msg-1'), 'session-1');

      let session = store.getSessionData('session-1');
      assert.equal(session.endTime, undefined);

      store.endSession('session-1');

      session = store.getSessionData('session-1');
      assert.ok(session.endTime instanceof Date);
    });

    it('should calculate session efficiency', () => {
      const usage1 = createMockUsage('msg-1', 1000);
      usage1.baselineTokens = 2000;
      usage1.tokensSaved = 1000;

      const usage2 = createMockUsage('msg-2', 500);
      usage2.baselineTokens = 1000;
      usage2.tokensSaved = 500;

      store.saveUsage(usage1, 'session-1');
      store.saveUsage(usage2, 'session-1');

      const session = store.getSessionData('session-1');

      assert.equal(session.totalTokens, 1500);
      assert.equal(session.totalBaselineTokens, 3000);
      assert.equal(session.totalTokensSaved, 1500);
      assert.equal(session.sessionEfficiency, 50); // (1500 / 3000) * 100
    });

    it('should deduplicate within session', () => {
      const usage1 = createMockUsage('msg-1', 1000);
      const usage2 = createMockUsage('msg-1', 2000); // Same message ID

      store.saveUsage(usage1, 'session-1');
      store.saveUsage(usage2, 'session-1');

      const session = store.getSessionData('session-1');

      assert.equal(session.messageCount, 1); // Only counted once
      assert.equal(session.totalTokens, 1000); // Only first usage counted
    });
  });

  describe('cleanup()', () => {
    it('should remove old records', () => {
      const now = Date.now();

      // Add old record (8 days ago)
      const oldUsage = createMockUsage('msg-old');
      oldUsage.timestamp = new Date(now - 8 * 24 * 60 * 60 * 1000);
      store.saveUsage(oldUsage);

      // Add recent record (1 day ago)
      const recentUsage = createMockUsage('msg-recent');
      recentUsage.timestamp = new Date(now - 1 * 24 * 60 * 60 * 1000);
      store.saveUsage(recentUsage);

      assert.equal(store.getTotalCount(), 2);

      const removed = store.cleanup();

      assert.equal(removed, 1); // Old record removed
      assert.equal(store.getTotalCount(), 1); // Recent record remains
    });

    it('should remove old sessions', () => {
      const now = Date.now();

      // Create old session (8 days ago) - must set endTime in the past
      const oldUsage = createMockUsage('msg-old');
      oldUsage.timestamp = new Date(now - 8 * 24 * 60 * 60 * 1000);
      store.saveUsage(oldUsage, 'session-old');

      // Manually set the session end time to 8 days ago
      const oldSession = store.getSessionData('session-old');
      oldSession.endTime = new Date(now - 8 * 24 * 60 * 60 * 1000);

      // Create recent session
      const recentUsage = createMockUsage('msg-recent');
      recentUsage.timestamp = new Date(now - 1 * 24 * 60 * 60 * 1000);
      store.saveUsage(recentUsage, 'session-recent');
      store.endSession('session-recent');

      assert.equal(store.getSessionCount(), 2);

      store.cleanup();

      assert.equal(store.getSessionCount(), 1); // Old session removed
      assert.ok(store.getSessionData('session-recent'));
      assert.equal(store.getSessionData('session-old'), undefined);
    });

    it('should not remove active sessions', () => {
      const now = Date.now();

      const oldUsage = createMockUsage('msg-old');
      oldUsage.timestamp = new Date(now - 8 * 24 * 60 * 60 * 1000);
      store.saveUsage(oldUsage, 'session-old');
      // Don't end session - it remains active

      store.cleanup();

      assert.equal(store.getSessionCount(), 1); // Active session kept
      assert.ok(store.getSessionData('session-old'));
    });
  });

  describe('clear()', () => {
    it('should clear all data', () => {
      store.saveUsage(createMockUsage('msg-1'), 'session-1');
      store.saveUsage(createMockUsage('msg-2'), 'session-2');

      assert.equal(store.getTotalCount(), 2);
      assert.equal(store.getSessionCount(), 2);

      store.clear();

      assert.equal(store.getTotalCount(), 0);
      assert.equal(store.getSessionCount(), 0);
    });
  });

  describe('getStats()', () => {
    it('should return storage statistics', () => {
      store.saveUsage(createMockUsage('msg-1'));
      store.saveUsage(createMockUsage('msg-2'), 'session-1');

      const stats = store.getStats();

      assert.equal(stats.totalRecords, 2);
      assert.equal(stats.totalSessions, 1);
      assert.ok(stats.oldestRecord instanceof Date);
      assert.ok(stats.newestRecord instanceof Date);
      assert.ok(stats.memoryUsageEstimate.includes('KB') ||
                stats.memoryUsageEstimate.includes('MB'));
    });

    it('should handle empty store', () => {
      const stats = store.getStats();

      assert.equal(stats.totalRecords, 0);
      assert.equal(stats.totalSessions, 0);
      assert.equal(stats.oldestRecord, undefined);
      assert.equal(stats.newestRecord, undefined);
    });
  });

  describe('destroy()', () => {
    it('should clear data and stop timers', () => {
      store.saveUsage(createMockUsage('msg-1'));

      store.destroy();

      assert.equal(store.getTotalCount(), 0);
    });
  });
});

/**
 * Helper to create mock usage record
 */
function createMockUsage(messageId, totalTokens = 1000) {
  return {
    messageId,
    timestamp: new Date(),
    inputTokens: Math.floor(totalTokens * 0.7),
    outputTokens: Math.floor(totalTokens * 0.3),
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens,
    baselineTokens: totalTokens * 2,
    tokensSaved: totalTokens,
    efficiencyPercentage: 50,
    costUSD: totalTokens * 0.000003,
    costSavingsUSD: totalTokens * 0.000003,
  };
}
