import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFirebaseSyncUrl } from '../src/lib/firebaseSyncUrl';

test('builds a Realtime Database REST URL with the ID token as an auth query parameter', () => {
  const url = buildFirebaseSyncUrl('https://l-pro-web-app-default-rtdb.asia-southeast1.firebasedatabase.app', 'family-universal-rebalance/users/uid-1', 'the-id-token');
  assert.equal(url, 'https://l-pro-web-app-default-rtdb.asia-southeast1.firebasedatabase.app/family-universal-rebalance/users/uid-1.json?auth=the-id-token');
});

test('strips a trailing slash from databaseURL before appending the path', () => {
  const url = buildFirebaseSyncUrl('https://example.firebasedatabase.app/', 'root/users/uid-1', 'token');
  assert.equal(url, 'https://example.firebasedatabase.app/root/users/uid-1.json?auth=token');
});

test('URL-encodes an ID token that contains reserved characters', () => {
  const url = buildFirebaseSyncUrl('https://example.firebasedatabase.app', 'root/users/uid-1', 'a.b&c=d');
  assert.equal(url, 'https://example.firebasedatabase.app/root/users/uid-1.json?auth=a.b%26c%3Dd');
});

test('rejects a missing databaseURL, path, or idToken with a distinct human-readable message each', () => {
  assert.throws(() => buildFirebaseSyncUrl('', 'root/users/uid-1', 'token'), /請先輸入 Firebase URL/);
  assert.throws(() => buildFirebaseSyncUrl('  ', 'root/users/uid-1', 'token'), /請先輸入 Firebase URL/);
  assert.throws(() => buildFirebaseSyncUrl('https://example.firebasedatabase.app', '', 'token'), /缺少同步路徑/);
  assert.throws(() => buildFirebaseSyncUrl('https://example.firebasedatabase.app', 'root/users/uid-1', ''), /缺少登入憑證/);
});
