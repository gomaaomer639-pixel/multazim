import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTrackingCredential, normalizeOrderNumber } from '../src/lib/tracking.js';

const origin = 'https://multazim.example';
const legacyToken = 'Abcdefghijklmnopqrstuvwxyz_0123456789-ABCDEFG';

test('normalizes valid order numbers and rejects ambiguous characters', () => {
  assert.equal(normalizeOrderNumber(' mlt-abcd-efgh-jklm '), 'MLT-ABCD-EFGH-JKLM');
  assert.equal(normalizeOrderNumber('MLT-ABCD-EFGH-IJKL'), '');
  assert.equal(normalizeOrderNumber('MLT-ABCD-EFGH-0JKL'), '');
});

test('accepts a new order number directly or from a tracking URL', () => {
  assert.deepEqual(extractTrackingCredential('mlt-abcd-efgh-jklm', origin), {
    type: 'orderNumber',
    value: 'MLT-ABCD-EFGH-JKLM',
  });
  assert.deepEqual(extractTrackingCredential(`${origin}/track-order#MLT-ABCD-EFGH-JKLM`, origin), {
    type: 'orderNumber',
    value: 'MLT-ABCD-EFGH-JKLM',
  });
});

test('keeps accepting legacy tracking tokens and links', () => {
  assert.deepEqual(extractTrackingCredential(legacyToken, origin), {
    type: 'trackingToken',
    value: legacyToken,
  });
  assert.deepEqual(extractTrackingCredential(`${origin}/track-order#${legacyToken}`, origin), {
    type: 'trackingToken',
    value: legacyToken,
  });
});

test('rejects unrelated links and malformed credentials', () => {
  assert.equal(extractTrackingCredential('', origin), null);
  assert.equal(extractTrackingCredential('MLT-ABCD-EFGH-IJKL', origin), null);
  assert.equal(extractTrackingCredential(`${origin}/other#${legacyToken}`, origin), null);
});
